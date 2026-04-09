
import { db } from '@/lib/db'
import { reviews } from '@/lib/schema'

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch recent reviews
  const recentReviews = await db.select().from(reviews).limit(10)
  
  // Calculate basic statistics
  const successCount = recentReviews.filter(r => r.success).length
  const successRate = recentReviews.length > 0 ? (successCount / recentReviews.length * 100).toFixed(1) : '--'
  
  const validLatencies = recentReviews.filter(r => r.latencyMs).map(r => r.latencyMs!)
  const avgLatency = validLatencies.length > 0 
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
    : null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Reviews</h3>
            <p className="text-2xl font-bold text-blue-600">{recentReviews.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Success Rate</h3>
            <p className="text-2xl font-bold text-green-600">{successRate}%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Avg Latency</h3>
            <p className="text-2xl font-bold text-yellow-600">{avgLatency ? `${avgLatency} ms` : '--'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
        {recentReviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Start testing some APIs!</p>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{review.serviceName || review.serviceDomain}</h3>
                      {review.taskSuccess !== null && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          review.taskSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {review.taskSuccess ? 'Task ✓' : 'Task ✗'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{review.endpoint}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Agent: {review.agentId}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
