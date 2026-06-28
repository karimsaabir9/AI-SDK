import connectDB from '../db/connection';
import Movie from '../db/models/Movie';
import User from '../db/models/User';
import Review from '../db/models/Review';
import ToolAnalytics from '../db/models/ToolAnalytics';

export interface DatabaseQueryResult {
  success: boolean;
  data: any[];
  total: number;
  status: string;
  executionTime: number;
  query?: string;
  error?: string;
}

type QueryIntent =
  | { type: 'movies_by_genre'; genre: string }
  | { type: 'movies_by_rating'; minRating: number }
  | { type: 'movies_count_by_genre' }
  | { type: 'movies_by_director'; director: string }
  | { type: 'movies_all' }
  | { type: 'users_older_than'; age: number }
  | { type: 'users_by_genre'; genre: string }
  | { type: 'users_all' }
  | { type: 'reviews_by_movie'; movieTitle: string }
  | { type: 'reviews_all' }
  | { type: 'unknown' };

function detectIntent(query: string): QueryIntent {
  const q = query.toLowerCase().trim();

  const genreMatch = q.match(
    /(?:show|find|get|list|display).*?(?:all\s+)?(\w+(?:-\w+)?)\s+(?:movies?|films?)/i
  );

  const KNOWN_GENRES = ['sci-fi', 'action', 'drama', 'comedy', 'thriller', 'horror', 'crime', 'romance', 'animation', 'fantasy', 'mystery', 'adventure', 'biography', 'history', 'musical', 'sport', 'war', 'western'];
  
  if (q.includes('count') && (q.includes('genre') || q.includes('type'))) {
    return { type: 'movies_count_by_genre' };
  }
  
  const ratingMatch = q.match(/rating[s]?\s+(?:above|over|greater than|>)\s+([\d.]+)/i) ||
                      q.match(/(?:above|over|greater than|>)\s+([\d.]+)\s+rating/i);
  if (ratingMatch) {
    return { type: 'movies_by_rating', minRating: parseFloat(ratingMatch[1]) };
  }

  const directorMatch = q.match(/(?:by|from|directed by|director)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
  if (directorMatch && (q.includes('movie') || q.includes('film') || q.includes('directed'))) {
    return { type: 'movies_by_director', director: directorMatch[1] };
  }
  for (const genre of KNOWN_GENRES) {
    if (q.includes(genre)) {
      return { type: 'movies_by_genre', genre: genre };
    }
  }
  if (genreMatch) {
    const potentialGenre = genreMatch[1];
    if (potentialGenre && potentialGenre !== 'all' && potentialGenre !== 'the') {
      return { type: 'movies_by_genre', genre: potentialGenre };
    }
  }
  if ((q.includes('movie') || q.includes('film')) && !q.includes('user')) {
    return { type: 'movies_all' };
  }

  const ageMatch = q.match(/(?:older|greater|more|above|over)\s+than\s+(\d+)/i) ||
                   q.match(/age\s+(?:>|above|over|greater than)\s+(\d+)/i);
  if (ageMatch && q.includes('user')) {
    return { type: 'users_older_than', age: parseInt(ageMatch[1]) };
  }

  
  const userGenreMatch = q.match(/users?\s+(?:who\s+)?(?:like[s]?|prefer[s]?|love[s]?|favorite|into)\s+(\w+)/i);
  if (userGenreMatch) {
    return { type: 'users_by_genre', genre: userGenreMatch[1] };
  }

  
  if (q.includes('review')) {
    const reviewMovieMatch = q.match(/reviews?\s+for\s+(.+)/i);
    if (reviewMovieMatch) {
      return { type: 'reviews_by_movie', movieTitle: reviewMovieMatch[1].trim() };
    }
    return { type: 'reviews_all' };
  }

  if (q.includes('user')) {
    return { type: 'users_all' };
  }

  return { type: 'unknown' };
}


export async function executeDatabaseQuery(
  naturalQuery: string,
  collection: 'movies' | 'users' | 'reviews' | 'auto' = 'auto'
): Promise<DatabaseQueryResult> {
  const startTime = Date.now();

  try {
    await connectDB();

    const intent = detectIntent(naturalQuery);
    let data: any[] = [];
    let total = 0;
    let queryDescription = '';

    switch (intent.type) {
      case 'movies_by_genre': {
        const regex = new RegExp(intent.genre, 'i');
        const docs = await Movie.find({ genre: regex }).sort({ rating: -1 }).limit(20).lean();
        data = docs;
        total = docs.length;
        queryDescription = `Movies with genre matching "${intent.genre}"`;
        break;
      }

      case 'movies_by_rating': {
        const docs = await Movie.find({ rating: { $gte: intent.minRating } })
          .sort({ rating: -1 })
          .limit(20)
          .lean();
        data = docs;
        total = docs.length;
        queryDescription = `Movies with rating ≥ ${intent.minRating}`;
        break;
      }

      case 'movies_count_by_genre': {
        const docs = await Movie.aggregate([
          { $group: { _id: '$genre', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
          { $sort: { count: -1 } },
          { $project: { genre: '$_id', count: 1, avgRating: { $round: ['$avgRating', 1] }, _id: 0 } },
        ]);
        data = docs;
        total = docs.length;
        queryDescription = 'Movie count grouped by genre';
        break;
      }

      case 'movies_by_director': {
        const regex = new RegExp(intent.director, 'i');
        const docs = await Movie.find({ director: regex }).sort({ rating: -1 }).limit(10).lean();
        data = docs;
        total = docs.length;
        queryDescription = `Movies directed by "${intent.director}"`;
        break;
      }

      case 'movies_all': {
        const docs = await Movie.find({}).sort({ rating: -1 }).limit(20).lean();
        data = docs;
        total = await Movie.countDocuments();
        queryDescription = 'All movies sorted by rating';
        break;
      }

      case 'users_older_than': {
        const docs = await User.find({ age: { $gt: intent.age } })
          .sort({ age: 1 })
          .limit(20)
          .lean();
        data = docs;
        total = docs.length;
        queryDescription = `Users older than ${intent.age}`;
        break;
      }

      case 'users_by_genre': {
        const regex = new RegExp(intent.genre, 'i');
        const docs = await User.find({ favoriteGenre: regex }).limit(20).lean();
        data = docs;
        total = docs.length;
        queryDescription = `Users who prefer "${intent.genre}" genre`;
        break;
      }

      case 'users_all': {
        const docs = await User.find({}).sort({ name: 1 }).limit(20).lean();
        data = docs;
        total = await User.countDocuments();
        queryDescription = 'All users';
        break;
      }

      case 'reviews_by_movie': {
        const movie = await Movie.findOne({ title: new RegExp(intent.movieTitle, 'i') });
        if (movie) {
          const docs = await Review.find({ movieId: movie._id })
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .limit(20)
            .lean();
          data = docs;
          total = docs.length;
          queryDescription = `Reviews for "${movie.title}"`;
        } else {
          data = [];
          total = 0;
          queryDescription = `No movie found matching "${intent.movieTitle}"`;
        }
        break;
      }

      case 'reviews_all': {
        const docs = await Review.find({})
          .populate('movieId', 'title')
          .populate('userId', 'name')
          .sort({ date: -1 })
          .limit(20)
          .lean();
        data = docs;
        total = await Review.countDocuments();
        queryDescription = 'All reviews';
        break;
      }

      default: {
        
        const [movieDocs, userDocs] = await Promise.all([
          Movie.find({}).sort({ rating: -1 }).limit(5).lean(),
          User.find({}).limit(5).lean(),
        ]);
        data = [...movieDocs, ...userDocs];
        total = data.length;
        queryDescription = 'General search results';
      }
    }

    const executionTime = Date.now() - startTime;

    
    await ToolAnalytics.create({
      toolName: 'queryDatabase',
      executionTime,
      success: true,
      query: naturalQuery,
    }).catch(() => {}); 

    return {
      success: true,
      data: data.map((item: any) => {
        
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(item)) {
          if (k === '__v') continue;
          if (k === '_id') { clean['id'] = String(v); continue; }
          clean[k] = (v instanceof Date || (v !== null && typeof v === 'object' && 'toHexString' in v)) ? String(v) : v;
        }
        return clean;
      }),
      total,
      status: 'success',
      executionTime,
      query: queryDescription,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    await ToolAnalytics.create({
      toolName: 'queryDatabase',
      executionTime,
      success: false,
      query: naturalQuery,
      errorMessage: error.message,
    }).catch(() => {});

    return {
      success: false,
      data: [],
      total: 0,
      status: 'error',
      executionTime,
      error: error.message || 'Database query failed',
    };
  }
}
