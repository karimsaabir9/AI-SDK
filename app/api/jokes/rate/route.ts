import { NextRequest } from 'next/server';
import { rateJoke } from '@/lib/tools/jokeTool';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jokeId, rating } = body as { jokeId: string; rating: 'thumbsUp' | 'thumbsDown' };

    if (!jokeId || !rating) {
      return Response.json({ error: 'jokeId and rating are required' }, { status: 400 });
    }

    if (rating !== 'thumbsUp' && rating !== 'thumbsDown') {
      return Response.json({ error: 'rating must be "thumbsUp" or "thumbsDown"' }, { status: 400 });
    }

    const result = await rateJoke(jokeId, rating);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 404 });
    }

    return Response.json(result);
  } catch (error: any) {
    console.error('[Jokes Rate API] Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
