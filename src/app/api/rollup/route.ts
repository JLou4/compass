export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyRollups, reviews } from '@/lib/schema';
import { eq, and, sql, count, avg } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`🔄 Starting daily rollup for date: ${targetDate}`);

    // Get all unique service domains that have reviews for this date
    const servicesForDate = await db
      .selectDistinct({ serviceDomain: reviews.serviceDomain })
      .from(reviews)
      .where(sql`DATE(${reviews.createdAt}) = ${targetDate}`);

    let processedServices = 0;
    let errors: string[] = [];

    for (const service of servicesForDate) {
      try {
        const serviceDomain = service.serviceDomain;

        // Calculate aggregated metrics for this service on this date
        const dailyStats = await db
          .select({
            totalCalls: count(),
            successCount: sql<number>`COUNT(CASE WHEN ${reviews.success} = true THEN 1 END)`,
            taskSuccessCount: sql<number>`COUNT(CASE WHEN ${reviews.taskSuccess} = true THEN 1 END)`,
            avgLatency: avg(reviews.latencyMs),
            avgReliability: avg(reviews.reliabilityScore),
            latencies: sql<string>`STRING_AGG(${reviews.latencyMs}::text, ',' ORDER BY ${reviews.latencyMs}) FILTER (WHERE ${reviews.latencyMs} IS NOT NULL)`
          })
          .from(reviews)
          .where(and(
            eq(reviews.serviceDomain, serviceDomain),
            sql`DATE(${reviews.createdAt}) = ${targetDate}`
          ));

        const stats = dailyStats[0];
        
        if (!stats || stats.totalCalls === 0) {
          continue;
        }

        // Calculate success rates
        const successRate = (stats.successCount / stats.totalCalls * 100);
        const taskSuccessRate = stats.taskSuccessCount > 0 
          ? (stats.taskSuccessCount / stats.totalCalls * 100) 
          : null;

        // Calculate P95 latency
        let p95Latency: number | null = null;
        if (stats.latencies) {
          const latencyArray = stats.latencies
            .split(',')
            .map(Number)
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
          
          if (latencyArray.length > 0) {
            const p95Index = Math.floor(latencyArray.length * 0.95);
            p95Latency = latencyArray[p95Index] || latencyArray[latencyArray.length - 1];
          }
        }

        // Check if rollup already exists for this service/date
        const existingRollup = await db
          .select()
          .from(dailyRollups)
          .where(and(
            eq(dailyRollups.serviceDomain, serviceDomain),
            eq(dailyRollups.date, targetDate)
          ))
          .limit(1);

        const rollupData = {
          serviceDomain,
          date: targetDate,
          totalCalls: stats.totalCalls,
          successRate: successRate.toFixed(2),
          taskSuccessRate: taskSuccessRate ? taskSuccessRate.toFixed(2) : null,
          avgLatencyMs: stats.avgLatency ? Math.round(Number(stats.avgLatency)) : null,
          p95LatencyMs: p95Latency,
          avgReliability: stats.avgReliability ? Number(stats.avgReliability).toFixed(2) : null
        };

        if (existingRollup.length > 0) {
          // Update existing rollup
          await db
            .update(dailyRollups)
            .set({
              totalCalls: rollupData.totalCalls,
              successRate: rollupData.successRate,
              taskSuccessRate: rollupData.taskSuccessRate,
              avgLatencyMs: rollupData.avgLatencyMs,
              p95LatencyMs: rollupData.p95LatencyMs,
              avgReliability: rollupData.avgReliability
            })
            .where(and(
              eq(dailyRollups.serviceDomain, serviceDomain),
              eq(dailyRollups.date, targetDate)
            ));
        } else {
          // Insert new rollup
          await db.insert(dailyRollups).values(rollupData);
        }

        processedServices++;
        console.log(`✅ Processed rollup for ${serviceDomain}: ${stats.totalCalls} calls, ${successRate.toFixed(1)}% success`);

      } catch (serviceError) {
        const errorMessage = `Error processing ${service.serviceDomain}: ${serviceError}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    const response = {
      success: true,
      date: targetDate,
      processedServices,
      totalServices: servicesForDate.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`🎯 Rollup completed: ${processedServices}/${servicesForDate.length} services processed`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in daily rollup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}