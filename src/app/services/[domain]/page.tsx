export const dynamic = 'force-dynamic';


import { db } from '@/lib/db'
import { reviews } from '@/lib/schema'
import { eq, desc, count, avg, sql } from 'drizzle-orm'
import Link from 'next/link'

interface ServicePageProps {
  params: {
    domain: string
  }
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const domain = decodeURIComponent(params.domain)

  // Get overall stats for this service
  const [overallStats] = await db
    .select({
      totalReviews: count(),
      successCount: sql<number>`COUNT(CASE WHEN ${reviews.success} = true THEN 1 END)`,
      taskSuccessCount: sql<number>`COUNT(CASE WHEN ${reviews.taskSuccess} = true THEN 1 END)`,
      avgLatency: avg(reviews.latencyMs),
      avgReliability: avg(reviews.reliabilityScore),
      totalCost: sql<number>`SUM(${reviews.costPerCall})`
    })
    .from(reviews)
    .where(eq(reviews.serviceDomain, domain))

  // Get recent reviews
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.serviceDomain, domain))
    .orderBy(desc(reviews.createdAt))
    .limit(50)

  // Get unique agents
  const uniqueAgents = await db
    .selectDistinct({ agentId: reviews.agentId })
    .from(reviews)
    .where(eq(reviews.serviceDomain, domain))

  // Calculate derived stats
  const successRate = overallStats.totalReviews > 0 ? (overallStats.successCount / overallStats.totalReviews * 100) : 0
  const taskSuccessRate = overallStats.totalReviews > 0 ? (overallStats.taskSuccessCount / overallStats.totalReviews * 100) : 0

  if (overallStats.totalReviews === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/services" className="text-blue-600 hover:text-blue-800">Services</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{domain}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{domain}</h1>
          <p className="text-gray-500">No reviews found for this service.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/services" className="text-blue-600 hover:text-blue-800">Services</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{domain}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{domain}</h1>
        <p className="text-gray-600">Service monitoring and performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-blue-800 text-sm">Total Reviews</h3>
          <p className="text-2xl font-bold text-blue-600">{overallStats.totalReviews}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800 text-sm">Success Rate</h3>
          <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-purple-800 text-sm">Task Success</h3>
          <p className="text-2xl font-bold text-purple-600">{taskSuccessRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-yellow-800 text-sm">Avg Latency</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {overallStats.avgLatency ? `${Math.round(Number(overallStats.avgLatency))}ms` : '—'}
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 text-sm">Avg Reliability</h3>
          <p className="text-xl font-bold text-gray-600">
            {overallStats.avgReliability ? (
              <>⭐ {parseFloat(Number(overallStats.avgReliability).toFixed(2))}/5</>
            ) : '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 text-sm">Total Cost</h3>
          <p className="text-xl font-bold text-gray-600">
            {overallStats.totalCost ? `$${parseFloat(Number(overallStats.totalCost).toFixed(4))}` : '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 text-sm">Unique Agents</h3>
          <p className="text-xl font-bold text-gray-600">{uniqueAgents.length}</p>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
        <div className="space-y-3">
          {recentReviews.slice(0, 10).map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.endpoint || 'No endpoint'}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{review.method}</span>
                    {review.taskSuccess !== null && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        review.taskSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {review.taskSuccess ? 'Task ✓' : 'Task ✗'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Agent: {review.agentId}</span>
                    <span>{new Date(review.createdAt!).toLocaleString()}</span>
                    {review.costPerCall && (
                      <span className="text-green-600">💰 ${review.costPerCall}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    review.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {review.statusCode || 'N/A'}
                  </span>
                  {review.latencyMs && (
                    <p className="text-xs text-gray-500 mt-1">{review.latencyMs}ms</p>
                  )}
                  {review.reliabilityScore && (
                    <p className="text-xs text-blue-600 mt-1">⭐ {review.reliabilityScore}/5</p>
                  )}
                </div>
              </div>
              {review.notes && (
                <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                  {review.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
