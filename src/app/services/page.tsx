import { db } from '@/lib/db'
import { dailyRollups } from '@/lib/schema'
import { sql, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Globe, BarChart3, Activity } from 'lucide-react'

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
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
    .orderBy(desc(sql`SUM(${dailyRollups.totalCalls})`));

  const services = serviceStats.map(service => ({
    serviceDomain: service.serviceDomain,
    latestDate: service.latestDate,
    totalCalls: Number(service.totalCalls) || 0,
    successRate: service.avgSuccessRate ? parseFloat(Number(service.avgSuccessRate).toFixed(1)) : null,
    taskSuccessRate: service.avgTaskSuccessRate ? parseFloat(Number(service.avgTaskSuccessRate).toFixed(1)) : null,
    avgLatencyMs: service.avgLatency ? Math.round(Number(service.avgLatency)) : null,
    avgP95LatencyMs: service.avgP95Latency ? Math.round(Number(service.avgP95Latency)) : null,
    avgReliability: service.avgReliability ? parseFloat(Number(service.avgReliability).toFixed(1)) : null
  }));

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
          <Link href="/" className="text-2xl font-serif text-white tracking-tight flex items-center hover:opacity-80 transition-opacity">
            <Globe className="w-6 h-6 text-cyan-400 mr-3" />
            Compass Network
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/services" className="text-cyan-400 border-b border-cyan-400/30 pb-1">Network Topography</Link>
              <Link href="/docs" className="text-white/40 hover:text-white transition-colors cursor-pointer">Agent API</Link>
          </nav>
        </header>

        <div className="mb-12">
            <h1 className="text-3xl font-serif text-white tracking-tight mb-2 flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400" />
              Network Topography
            </h1>
            <p className="text-white/50 text-sm">Active aggregate routing matrices evaluating external dependency drift over all historical telemetry.</p>
        </div>

        <div className="w-full tidal-glass-panel rounded-2xl overflow-hidden mb-24">
          <div className="p-6 border-b border-white/10 bg-black/50 flex justify-between items-center">
              <h2 className="text-xl font-serif text-white tracking-tight flex items-center">
                  <BarChart3 className="w-5 h-5 text-cyan-400 mr-3" />
                  Global API Ledger
              </h2>
              <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Service Domain</th>
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Metrics Volume</th>
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">HTTP Success</th>
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Task Success</th>
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Failure Delta</th>
                          <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Avg Latency</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                      {services.map((svc, i) => {
                          const delta = (svc.successRate !== null && svc.taskSuccessRate !== null) 
                            ? (svc.successRate - svc.taskSuccessRate).toFixed(1)
                            : '--';
                          
                          let deltaColor = "text-white/40";
                          if (delta !== '--') {
                              const v = parseFloat(delta);
                              if (v > 10) deltaColor = "text-red-400 font-medium";
                              else if (v > 5) deltaColor = "text-yellow-400";
                              else deltaColor = "text-cyan-400";
                          }

                          return (
                              <tr key={i} className="hover:bg-white/5 transition-colors group">
                                  <td className="py-4 px-6 relative">
                                      <Link href={`/services/${encodeURIComponent(svc.serviceDomain)}`} className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                        {svc.serviceDomain}
                                      </Link>
                                  </td>
                                  <td className="py-4 px-6 text-sm text-white/60 font-mono">
                                      {svc.totalCalls.toLocaleString()} calls
                                  </td>
                                  <td className="py-4 px-6">
                                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-white/80 border border-white/10 font-mono">
                                          {svc.successRate !== null ? `${svc.successRate}%` : '--'}
                                      </span>
                                  </td>
                                  <td className="py-4 px-6">
                                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                          {svc.taskSuccessRate !== null ? `${svc.taskSuccessRate}%` : '--'}
                                      </span>
                                  </td>
                                  <td className={`py-4 px-6 text-sm font-mono ${deltaColor}`}>
                                      {delta !== '--' ? `Δ ${delta}%` : '--'}
                                  </td>
                                  <td className="py-4 px-6 text-sm font-mono text-white/60">
                                      {svc.avgLatencyMs !== null ? `${svc.avgLatencyMs}ms` : '--'}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  )
}
