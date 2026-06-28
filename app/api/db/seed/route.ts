import { NextRequest } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';

export async function GET(req: NextRequest) {

  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Seed endpoint disabled in production' }, { status: 403 });
  }

  try {
    const result = await seedDatabase();
    return Response.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Seed API] Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
