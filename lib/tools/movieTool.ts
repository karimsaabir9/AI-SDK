import connectDB from '../db/connection';
import CachedMovie from '../db/models/CachedMovie';
import ToolAnalytics from '../db/models/ToolAnalytics';

export interface MovieResult {
  tmdbId: number;
  title: string;
  year: string;
  genre: string;
  rating: string;
  plot: string;
  cast: string;
  director: string;
  runtime: string;
  poster: string;
  backdrop: string;
  productionCompanies: string;
  recommendations: any[];
  fromCache: boolean;
}

export interface MovieToolResult {
  success: boolean;
  movies: MovieResult[];
  total: number;
  fromCache?: boolean;
  error?: string;
  executionTime: number;
}


interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false,
};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 60_000; 

function checkCircuitBreaker(): boolean {
  if (!circuitBreaker.isOpen) return true;
  const now = Date.now();
  if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    return true;
  }
  return false;
}

function recordCircuitFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    console.warn('[MovieTool] Circuit breaker OPEN — TMDB API temporarily disabled');
  }
}

function recordCircuitSuccess() {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
}




const TMDB_BASE = 'https://api.themoviedb.org/3';

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

function buildUrl(path: string, extraParams: Record<string, string> = {}) {
  const params = new URLSearchParams({
    api_key: process.env.TMDB_API_TOKEN || '',
    ...extraParams,
  });
  return `${TMDB_BASE}${path}?${params.toString()}`;
}

function getImageUrl(path: string | null, size: string = 'w500') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function mapTmdbToResult(data: any, fromCache = false): MovieResult {
  const credits = data.credits || { cast: [], crew: [] };
  const directorObj = credits.crew?.find((c: any) => c.job === 'Director');
  const castList = credits.cast?.slice(0, 5).map((c: any) => c.name).join(', ') || 'N/A';
  
  const genres = data.genres?.map((g: any) => g.name).join(', ') || 'N/A';
  const prodCompanies = data.production_companies?.map((p: any) => p.name).join(', ') || 'N/A';
  const recommendations = data.recommendations?.results?.slice(0, 3).map((r: any) => ({
    title: r.title,
    poster: getImageUrl(r.poster_path, 'w200')
  })) || [];

  return {
    tmdbId: data.id,
    title: data.title || 'Unknown',
    year: data.release_date ? data.release_date.slice(0, 4) : 'N/A',
    genre: genres,
    rating: data.vote_average ? `${data.vote_average.toFixed(1)}/10` : 'N/A',
    plot: data.overview || 'No description available.',
    cast: castList,
    director: directorObj ? directorObj.name : 'N/A',
    runtime: data.runtime ? `${data.runtime} min` : 'N/A',
    poster: getImageUrl(data.poster_path),
    backdrop: getImageUrl(data.backdrop_path, 'w1280'),
    productionCompanies: prodCompanies,
    recommendations,
    fromCache,
  };
}

async function fetchTmdbDetails(movieId: number): Promise<any> {
  const url = buildUrl(`/movie/${movieId}`, { append_to_response: 'credits,recommendations' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function searchTmdb(title: string, year?: string): Promise<any[]> {
  const extra: Record<string, string> = { query: title };
  if (year) extra.year = year;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(buildUrl('/search/movie', extra), {
      headers: getHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return [];

    const results = data.results.slice(0, 3);
    const detailed = await Promise.allSettled(
      results.map((r: any) => fetchTmdbDetails(r.id))
    );
    return detailed
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value);
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function getCachedMovie(title: string, year?: string): Promise<any | null> {
  try {
    const query: Record<string, any> = {
      title: { $regex: new RegExp(`^${title}$`, 'i') },
    };
    if (year) query.year = year;
    const cached = await CachedMovie.findOne(query).lean();
    return cached?.data || null;
  } catch {
    return null;
  }
}

async function cacheMovie(data: any): Promise<void> {
  try {
    await CachedMovie.findOneAndUpdate(
      { tmdbId: data.id },
      {
        tmdbId: data.id,
        title: data.title,
        year: data.release_date ? data.release_date.slice(0, 4) : '',
        data,
        cachedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch {
   
  }
}

async function getFallbackFromCache(title: string): Promise<any[]> {
  try {
    const docs = await CachedMovie.find({
      title: { $regex: new RegExp(title, 'i') },
    })
      .limit(3)
      .lean();
    return docs.map((d) => d.data);
  } catch {
    return [];
  }
}

export async function searchMovies(
  title: string,
  year?: string
): Promise<MovieToolResult> {
  const startTime = Date.now();

  try {
    if (!process.env.TMDB_API_TOKEN) throw new Error('Missing TMDB_API_TOKEN in environment variables.');

    await connectDB();

    
    const cachedData = await getCachedMovie(title, year);
    if (cachedData) {
      const executionTime = Date.now() - startTime;
      await ToolAnalytics.create({
        toolName: 'searchMovies',
        executionTime,
        success: true,
        query: title,
      }).catch(() => {});

      return {
        success: true,
        movies: [mapTmdbToResult(cachedData, true)],
        total: 1,
        fromCache: true,
        executionTime,
      };
    }

    
    if (!checkCircuitBreaker()) {
      const fallback = await getFallbackFromCache(title);
      const executionTime = Date.now() - startTime;
      if (fallback.length > 0) {
        return {
          success: true,
          movies: fallback.map((d) => mapTmdbToResult(d, true)),
          total: fallback.length,
          fromCache: true,
          executionTime,
        };
      }
      return {
        success: false,
        movies: [],
        total: 0,
        executionTime,
        error: 'Movie API is temporarily unavailable. Please try again in a minute.',
      };
    }

    let rawMovies: any[] = [];
    try {
      rawMovies = await searchTmdb(title, year);
      if (rawMovies.length === 0) throw new Error('Movie not found');
      recordCircuitSuccess();
    } catch (err: any) {
      recordCircuitFailure();
      throw err;
    }


    await Promise.allSettled(rawMovies.map(cacheMovie));

    const executionTime = Date.now() - startTime;
    await ToolAnalytics.create({
      toolName: 'searchMovies',
      executionTime,
      success: true,
      query: title,
    }).catch(() => {});

    return {
      success: true,
      movies: rawMovies.map((d) => mapTmdbToResult(d, false)),
      total: rawMovies.length,
      fromCache: false,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

   
    const fallback = await getFallbackFromCache(title).catch(() => []);
    if (fallback.length > 0) {
      return {
        success: true,
        movies: fallback.map((d) => mapTmdbToResult(d, true)),
        total: fallback.length,
        fromCache: true,
        executionTime,
        error: 'Live data unavailable — showing cached results',
      };
    }

    await ToolAnalytics.create({
      toolName: 'searchMovies',
      executionTime,
      success: false,
      query: title,
      errorMessage: error.message,
    }).catch(() => {});

    let userMessage = error.message || 'Failed to fetch movie data';
    if (error.name === 'AbortError') userMessage = 'Request timed out. Please try again.';
    if (error.message?.includes('401')) userMessage = 'Invalid TMDB API Token. Check your .env.local file.';
    if (error.message?.includes('429')) userMessage = 'TMDB API rate limit reached. Please wait a moment.';

    return {
      success: false,
      movies: [],
      total: 0,
      executionTime,
      error: userMessage,
    };
  }
}
