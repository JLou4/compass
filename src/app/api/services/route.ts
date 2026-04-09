import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyRollups } from '@/lib/schema';
import { sql, desc } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const serviceStats = await db
      .select({
        serviceDomain: dailyRollups.serviceDomain,
        latestDate: sql<Date>`MAX(${dailyRollups.date})`,
        totalCalls: sql<number>`SUM(${dailyRollups.totalCalls})`,
        avgSuccessRate: sql<number>`AVG(${dailyRollups.successRate})`,
        avgTaskSuccessRate: sql<number>`AVG(${dailyRollups.taskSuccessRate})`,
        avgLatency: sql<number>`AVG(${dailyRollups.avgLatencyMs})`,
        avgP95Latency: sql<number>`AVG(${dailyRollups.p95LatencyMs})`,
        avgReliability: sql<number>`AVG(${dailyRollups.avgReliability})`
      })
      .from(dailyRollups)
      .groupBy(dailyRollups.serviceDomain)
      .orderBy(desc(sql`MAX(${dailyRollups.date})`));

    const services = serviceStats.map(service => ({
      serviceDomain: service.serviceDomain,
      latestDate: service.latestDate,
      totalCalls: Number(service.totalCalls) || 0,
      successRate: service.avgSuccessRate ? parseFloat(Number(service.avgSuccessRate).toFixed(2)) : null,
      taskSuccessRate: service.avgTaskSuccessRate ? parseFloat(Number(service.avgTaskSuccessRate).toFixed(2)) : null,
      avgLatencyMs: service.avgLatency ? Math.round(Number(service.avgLatency)) : null,
      avgP95LatencyMs: service.avgP95Latency ? Math.round(Number(service.avgP95Latency)) : null,
      avgReliability: service.avgReliability ? parseFloat(Number(service.avgReliability).toFixed(2)) : null
    }));

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
