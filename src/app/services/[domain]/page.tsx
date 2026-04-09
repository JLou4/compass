import { db } from '@/lib/db'
import { reviews } from '@/lib/schema'
import { eq, desc, count, avg, sql } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic";

interface ServicePageProps {
  params: {
    domain: string
  }
}

const Badge = ({ children, className, variant }: any) => <span className={`px-2 py-0.5 rounded text-xs font-semibold ${className}`}>{children}</span>;

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const domain = decodeURIComponent(params.domain)

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

  const recentReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.serviceDomain, domain))
    .orderBy(desc(reviews.createdAt))
    .limit(50)

  const uniqueAgents = await db
    .selectDistinct({ agentId: reviews.agentId })
    .from(reviews)
    .where(eq(reviews.serviceDomain, domain))

  const successRate = overallStats.totalReviews > 0 ? (overallStats.successCount / overallStats.totalReviews * 100) : 0
  const taskSuccessRate = overallStats.totalReviews > 0 ? (overallStats.taskSuccessCount / overallStats.totalReviews * 100) : 0
  const delta = taskSuccessRate - successRate

  if (overallStats.totalReviews === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 p-8 font-sans selection:bg-indigo-500/30">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Matrix
          </Link>
          <div className="bg-[#111110] border border-white/5 rounded-xl p-12 text-center shadow-2xl">
             <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4 opacity-50" />
             <h1 className="text-3xl font-light tracking-tight text-white mb-2">{domain}</h1>
             <p className="text-zinc-500">Awaiting telemetry ingestion. No routes monitored yet.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Matrix
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">{domain}</h1>
            </div>
            <p className="text-zinc-500 mt-2 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live telemetry from {uniqueAgents.length} autonomous swarms
            </p>
          </div>
          <div className="text-left md:text-right">
             <div className="text-4xl font-light text-white tracking-tight">{overallStats.totalReviews.toLocaleString()}</div>
             <div className="text-sm text-zinc-500 uppercase tracking-widest mt-1">Total Pings</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800" />
            <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Claim (HTTP OK)</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-3xl font-light text-white">{successRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />
            <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Reality (Task OK)</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-3xl font-light text-emerald-400">{taskSuccessRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20" />
            <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              Failure Delta
            </h3>
            <div className="flex items-baseline gap-2">
               <p className={`text-3xl font-light ${delta < -10 ? 'text-rose-400' : delta < -5 ? 'text-amber-400' : 'text-zinc-300'}`}>
                 {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
               </p>
            </div>
            <p className="text-xs text-zinc-600 mt-2">Gap between 200s and actual utility</p>
          </div>

          <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" />
             <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Avg Latency</h3>
             <div className="flex items-baseline gap-2">
               <p className="text-3xl font-light text-blue-400">
                 {overallStats.avgLatency ? `${Math.round(Number(overallStats.avgLatency))}ms` : '—'}
               </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl flex items-center justify-between hover:border-white/10 transition-colors">
              <div>
                 <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">Network Cost</h3>
                 <p className="text-2xl font-light text-white flex items-center gap-2">
                   <DollarSign className="w-5 h-5 text-emerald-500" />
                   {overallStats.totalCost ? parseFloat(Number(overallStats.totalCost).toFixed(4)) : '0.00'}
                 </p>
              </div>
           </div>
           
           <div className="bg-[#111110] border border-white/5 rounded-xl p-6 shadow-xl flex items-center justify-between hover:border-white/10 transition-colors">
              <div>
                 <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">Provider Rating</h3>
                 <p className="text-2xl font-light text-white flex items-center gap-2">
                   <span className="text-amber-400">★</span>
                   {overallStats.avgReliability ? parseFloat(Number(overallStats.avgReliability).toFixed(2)) : '—'} <span className="text-zinc-600 text-lg">/ 5.0</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Ledger Feed */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
             <h2 className="text-lg font-medium text-white flex items-center gap-2">
                Raw Telemetry Feed 
                <Badge variant="outline" className="bg-white/5 text-zinc-400 border border-white/10 font-mono text-xs">LIMIT 50</Badge>
             </h2>
          </div>
          
          <div className="bg-[#111110] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-[#161615] border-b border-white/5">
                      <tr className="text-zinc-400 uppercase tracking-wider text-xs font-medium">
                         <th className="px-6 py-4">Timestamp</th>
                         <th className="px-6 py-4">Endpoint</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-center border-l border-white/5">Task Reality</th>
                         <th className="px-6 py-4 text-right">Latency</th>
                         <th className="px-6 py-4 text-right">Agent ID</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {recentReviews.map((log) => (
                         <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                               {new Date(log.createdAt!).toISOString().replace('T', ' ').substring(0, 19)}
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2 max-w-[250px] lg:max-w-[400px] truncate" title={log.endpoint || ''}>
                                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 font-mono border border-zinc-700 px-1.5 py-0.5 rounded text-[10px] uppercase">
                                     {log.method}
                                  </Badge>
                                  <span className="text-zinc-300 font-mono text-xs truncate">{log.endpoint?.split('?')[0] || '/'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <Badge variant="outline" className={`font-mono border border-white/10 ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                  {log.statusCode || '---'}
                               </Badge>
                            </td>
                            <td className="px-6 py-4 text-center border-l border-white/5">
                               <div className="flex justify-center">
                                  {log.taskSuccess ? (
                                     <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-90" />
                                  ) : (
                                     <XCircle className="w-5 h-5 text-rose-500 opacity-90" />
                                  )}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-zinc-400 font-mono flex items-center justify-end gap-1.5">
                                  <Clock className="w-3 h-3 opacity-50" />
                                  {log.latencyMs}ms
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-zinc-500 font-mono text-xs">{log.agentId}</span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
