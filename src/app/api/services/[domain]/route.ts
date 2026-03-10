import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyRollups, reviews } from '@/lib/schema';
import { eq, desc, count, avg, sql } from 'drizzle-orm';

interface RouteParams {
  params: {
    domain: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const domain = params.domain;

    // Get daily rollup data for this service (last 30 days)
    const rollupData = await db
      .select()
      .from(dailyRollups)
      .where(eq(dailyRollups.serviceDomain, domain))
      .orderBy(desc(dailyRollups.date))
      .limit(30);

    // Get recent raw reviews for this service
    const recentReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceDomain, domain))
      .orderBy(desc(reviews.createdAt))
      .limit(100);

    // Calculate overall stats
    const overallStats = await db
      .select({
        totalReviews: count(),
        avgLatency: avg(reviews.latencyMs),
        avgReliability: avg(reviews.reliabilityScore),
        successCount: sql<number>`COUNT(CASE WHEN ${reviews.success} = true THEN 1 END)`,
        taskSuccessCount: sql<number>`COUNT(CASE WHEN ${reviews.taskSuccess} = true THEN 1 END)`,
        totalCostEstimate: sql<number>`SUM(${reviews.costPerCall})`
      })
      .from(reviews)
      .where(eq(reviews.serviceDomain, domain));

    const stats = overallStats[0];
    const totalReviews = stats.totalReviews;
    
    // Calculate derived metrics
    const successRate = totalReviews > 0 ? (stats.successCount / totalReviews * 100) : 0;
    const taskSuccessRate = totalReviews > 0 ? (stats.taskSuccessCount / totalReviews * 100) : 0;

    // Get unique agents for this service
    const uniqueAgents = await db
      .selectDistinct({ agentId: reviews.agentId })
      .from(reviews)
      .where(eq(reviews.serviceDomain, domain));

    return NextResponse.json({
      serviceDomain: domain,
      overview: {
        totalReviews,
        successRate: parseFloat(successRate.toFixed(2)),
        taskSuccessRate: parseFloat(taskSuccessRate.toFixed(2)),
        avgLatencyMs: stats.avgLatency ? Math.round(stats.avgLatency) : null,
        avgReliability: stats.avgReliability ? parseFloat(stats.avgReliability.toFixed(2)) : null,
        totalCostEstimate: stats.totalCostEstimate ? parseFloat(stats.totalCostEstimate.toFixed(6)) : null,
        uniqueAgents: uniqueAgents.length
      },
      dailyRollups: rollupData,
      recentReviews: recentReviews.slice(0, 20), // Return last 20 reviews
      agents: uniqueAgents.map(a => a.agentId)
    });

  } catch (error) {
    console.error('Error fetching service details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}