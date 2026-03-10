import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      agentId,
      serviceDomain: providedServiceDomain,
      serviceName,
      endpoint,
      taskCategory,
      method = 'GET',
      statusCode,
      success,
      taskSuccess,
      latencyMs,
      costPerCall,
      reliabilityScore,
      notes
    } = body;

    // Auto-parse service_domain from endpoint URL if not provided
    let serviceDomain = providedServiceDomain;
    if (!serviceDomain && endpoint) {
      try {
        const url = new URL(endpoint);
        serviceDomain = url.hostname;
      } catch (error) {
        // Invalid URL, keep serviceDomain undefined
      }
    }

    // Validate required fields
    if (!agentId || !serviceDomain || success === undefined) {
      return NextResponse.json(
        { error: 'agentId, serviceDomain, and success are required' },
        { status: 400 }
      );
    }

    // Validate reliability score if provided
    if (reliabilityScore !== undefined && (reliabilityScore < 1 || reliabilityScore > 5)) {
      return NextResponse.json(
        { error: 'reliability_score must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert review into database
    const result = await db.insert(reviews).values({
      agentId,
      serviceDomain,
      serviceName,
      endpoint,
      taskCategory,
      method,
      statusCode,
      success,
      taskSuccess,
      latencyMs,
      costPerCall,
      reliabilityScore,
      notes,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service'); // service domain filter
    const agentId = searchParams.get('agentId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = db.select().from(reviews);

    // Add service domain filter if provided
    if (service) {
      query = query.where(eq(reviews.serviceDomain, service));
    }

    // Add agent filter if provided  
    if (agentId) {
      query = query.where(eq(reviews.agentId, agentId));
    }

    // Sort by recency
    const allReviews = await query.orderBy(desc(reviews.createdAt)).limit(limit);
    
    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}