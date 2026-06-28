import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_studio';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}


declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function connectWithRetry(retries = MAX_RETRIES): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected to ${MONGODB_URI}`);
    return conn;
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`[MongoDB] Connection failed, retrying in ${RETRY_DELAY_MS}ms... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)));
      return connectWithRetry(retries - 1);
    }
    console.error('[MongoDB] All connection retries exhausted:', err.message);
    throw err;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = connectWithRetry().catch((err) => {
      cache.promise = null;
      throw err;
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectDB;
