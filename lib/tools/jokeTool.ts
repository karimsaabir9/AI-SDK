import connectDB from '../db/connection';
import Joke from '../db/models/Joke';
import ToolAnalytics from '../db/models/ToolAnalytics';

export interface JokeResult {
  success: boolean;
  joke?: string;
  jokeId?: string;
  source: 'api' | 'db' | 'fallback';
  thumbsUp?: number;
  thumbsDown?: number;
  error?: string;
  executionTime: number;
}

export interface RateJokeResult {
  success: boolean;
  jokeId: string;
  thumbsUp: number;
  thumbsDown: number;
  error?: string;
}

const DADJOKE_API = 'https://icanhazdadjoke.com/';
const HEADERS = { Accept: 'application/json', 'User-Agent': 'ai-studio-app (github.com/example)' };


const LOCAL_FALLBACK_JOKES = [
  { jokeId: 'local-1', joke: "Why don't scientists trust atoms? Because they make up everything." },
  { jokeId: 'local-2', joke: "I told my wife she was drawing her eyebrows too high. She looked surprised." },
  { jokeId: 'local-3', joke: "Why do programmers prefer dark mode? Because light attracts bugs." },
  { jokeId: 'local-4', joke: "I'm reading a book about anti-gravity. It's impossible to put down." },
  { jokeId: 'local-5', joke: "Why did the scarecrow win an award? Because he was outstanding in his field." },
];


async function fetchRandomJokeFromApi(): Promise<{ id: string; joke: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(DADJOKE_API, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { id: data.id, joke: data.joke };
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function searchJokesFromApi(term: string): Promise<{ id: string; joke: string }[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `${DADJOKE_API}search?term=${encodeURIComponent(term)}&limit=5`;
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((j: any) => ({ id: j.id, joke: j.joke }));
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}


async function saveJokeToDB(id: string, joke: string, source: 'api' | 'local' = 'api') {
  try {
    await Joke.findOneAndUpdate(
      { jokeId: id },
      { jokeId: id, joke, source },
      { upsert: true, new: true }
    );
  } catch {

  }
}

async function getRandomJokeFromDB(): Promise<{ jokeId: string; joke: string; thumbsUp: number; thumbsDown: number } | null> {
  try {
    const count = await Joke.countDocuments();
    if (count === 0) return null;
    const random = Math.floor(Math.random() * count);
    const doc = await Joke.findOne().skip(random).lean();
    if (!doc) return null;
    return { jokeId: doc.jokeId, joke: doc.joke, thumbsUp: doc.thumbsUp, thumbsDown: doc.thumbsDown };
  } catch {
    return null;
  }
}

async function searchJokesFromDB(term: string): Promise<{ jokeId: string; joke: string }[]> {
  try {
    const docs = await Joke.find({
      joke: { $regex: new RegExp(term, 'i') },
    })
      .limit(3)
      .lean();
    return docs.map((d) => ({ jokeId: d.jokeId, joke: d.joke }));
  } catch {
    return [];
  }
}


export async function getRandomJoke(): Promise<JokeResult> {
  const startTime = Date.now();

  try {
    await connectDB();

    const { id, joke } = await fetchRandomJokeFromApi();
    await saveJokeToDB(id, joke, 'api');
    const savedJoke = await Joke.findOne({ jokeId: id }).lean();

    const executionTime = Date.now() - startTime;
    await ToolAnalytics.create({ toolName: 'getJoke', executionTime, success: true }).catch(() => {});

    return {
      success: true,
      joke,
      jokeId: id,
      source: 'api',
      thumbsUp: savedJoke?.thumbsUp ?? 0,
      thumbsDown: savedJoke?.thumbsDown ?? 0,
      executionTime,
    };
  } catch {

    const dbJoke = await getRandomJokeFromDB();
    if (dbJoke) {
      return {
        success: true,
        joke: dbJoke.joke,
        jokeId: dbJoke.jokeId,
        source: 'db',
        thumbsUp: dbJoke.thumbsUp,
        thumbsDown: dbJoke.thumbsDown,
        executionTime: Date.now() - startTime,
      };
    }


    const fallback = LOCAL_FALLBACK_JOKES[Math.floor(Math.random() * LOCAL_FALLBACK_JOKES.length)];
    return {
      success: true,
      joke: fallback.joke,
      jokeId: fallback.jokeId,
      source: 'fallback',
      thumbsUp: 0,
      thumbsDown: 0,
      executionTime: Date.now() - startTime,
    };
  }
}

export async function searchJokes(term: string): Promise<JokeResult> {
  const startTime = Date.now();

  try {
    await connectDB();

    try {
      const jokes = await searchJokesFromApi(term);
      if (jokes.length > 0) {
        await Promise.allSettled(jokes.map((j) => saveJokeToDB(j.id, j.joke)));
        const executionTime = Date.now() - startTime;
        await ToolAnalytics.create({ toolName: 'getJoke', executionTime, success: true, query: term }).catch(() => {});
        return {
          success: true,
          joke: jokes[0].joke,
          jokeId: jokes[0].id,
          source: 'api',
          executionTime,
        };
      }
    } catch {

    }

    
    const dbJokes = await searchJokesFromDB(term);
    if (dbJokes.length > 0) {
      return {
        success: true,
        joke: dbJokes[0].joke,
        jokeId: dbJokes[0].jokeId,
        source: 'db',
        executionTime: Date.now() - startTime,
      };
    }

    return {
      success: false,
      source: 'fallback',
      error: `No jokes found for "${term}"`,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      source: 'fallback',
      error: error.message || 'Failed to search jokes',
      executionTime: Date.now() - startTime,
    };
  }
}

export async function rateJoke(
  jokeId: string,
  rating: 'thumbsUp' | 'thumbsDown'
): Promise<RateJokeResult> {
  try {
    await connectDB();
    const update = rating === 'thumbsUp' ? { $inc: { thumbsUp: 1 } } : { $inc: { thumbsDown: 1 } };
    const updated = await Joke.findOneAndUpdate({ jokeId }, update, { new: true });

    if (!updated) {
      return { success: false, jokeId, thumbsUp: 0, thumbsDown: 0, error: 'Joke not found' };
    }

    await ToolAnalytics.create({ toolName: 'rateJoke', executionTime: 0, success: true, query: jokeId }).catch(() => {});

    return {
      success: true,
      jokeId,
      thumbsUp: updated.thumbsUp,
      thumbsDown: updated.thumbsDown,
    };
  } catch (error: any) {
    return { success: false, jokeId, thumbsUp: 0, thumbsDown: 0, error: error.message };
  }
}
