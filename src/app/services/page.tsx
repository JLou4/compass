export const dynamic = 'force-dynamic';


import { db } from '@/lib/db'
import { reviews } from '@/lib/schema'
import { sql, count } from 'drizzle-orm'
import Link from 'next/link'

export default async function ServicesPage() {
  // Get service stats from raw reviews (since rollups might not exist yet)
  const serviceStats = await db
    .select({
      serviceDomain: reviews.serviceDomain,
      totalReviews: count(),
      successCount: sql<number>`COUNT(CASE WHEN ${reviews.success} = true THEN 1 END)`,
      avgLatency: sql<number>`AVG(${reviews.latencyMs})`,
      avgReliability: sql<number>`AVG(${reviews.reliabilityScore})`,
      lastSeen: sql<Date>`MAX(${reviews.createdAt})`
    })
    .from(reviews)
    .groupBy(reviews.serviceDomain)
    .orderBy(sql`MAX(${reviews.createdAt}) DESC`);

  const servicesWithStats = serviceStats.map(service => ({
    ...service,
    successRate: service.totalReviews > 0 ? (service.successCount / service.totalReviews * 100) : 0,
    avgLatency: service.avgLatency ? Math.round(Number(service.avgLatency)) : null,
    avgReliability: service.avgReliability ? parseFloat(Number(service.avgReliability).toFixed(1)) : null
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <div className="text-sm text-gray-600">
          {serviceStats.length} services monitored
        </div>
      </div>

      {servicesWithStats.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No services found. Start creating reviews!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Service</th>
                  <th className="text-left p-4 font-semibold">Reviews</th>
                  <th className="text-left p-4 font-semibold">Success Rate</th>
                  <th className="text-left p-4 font-semibold">Avg Latency</th>
                  <th className="text-left p-4 font-semibold">Reliability</th>
                  <th className="text-left p-4 font-semibold">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {servicesWithStats.map((service) => (
                  <tr key={service.serviceDomain} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <Link 
                        href={`/services/${encodeURIComponent(service.serviceDomain)}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {service.serviceDomain}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600">{service.totalReviews}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        service.successRate >= 95 ? 'bg-green-100 text-green-800' :
                        service.successRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {service.avgLatency ? `${service.avgLatency}ms` : '—'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {service.avgReliability ? (
                        <span className="flex items-center">
                          ⭐ {service.avgReliability}/5
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(service.lastSeen).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
