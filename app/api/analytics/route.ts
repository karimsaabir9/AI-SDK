import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import ToolAnalytics from '@/lib/db/models/ToolAnalytics';
import Joke from '@/lib/db/models/Joke';
import CachedMovie from '@/lib/db/models/CachedMovie';

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const [toolStats, topJokes, cachedMoviesCount] = await Promise.all([

      ToolAnalytics.aggregate([
        {
          $group: {
            _id: '$toolName',
            count: { $sum: 1 },
            successCount: { $sum: { $cond: ['$success', 1, 0] } },
            avgExecutionTime: { $avg: '$executionTime' },
          },
        },
        {
          $project: {
            toolName: '$_id',
            count: 1,
            successCount: 1,
            successRate: {
              $round: [{ $multiply: [{ $divide: ['$successCount', '$count'] }, 100] }, 1],
            },
            avgExecutionTime: { $round: ['$avgExecutionTime', 0] },
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
      ]),


      Joke.find({}).sort({ thumbsUp: -1 }).limit(3).select('jokeId joke thumbsUp thumbsDown').lean(),


      CachedMovie.countDocuments(),
    ]);

    return Response.json({
      success: true,
      toolStats,
      topJokes,
      cachedMoviesCount,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Analytics API] Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
