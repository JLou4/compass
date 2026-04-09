export const dynamic = 'force-dynamic';

import { db } from '@/lib/db'
import { reviews, dailyRollups } from '@/lib/schema'
import { desc, sql } from 'drizzle-orm'

export default async function Home() {
  // @lat: [[database_schema#reviews Table (Raw Agent Logs)]]
  const recentReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(12)
  
  // @lat: [[database_schema#daily_rollups Table (Aggregated Metrics)]]
  const topServices = await db.select({
      domain: dailyRollups.serviceDomain,
      calls: sql`SUM(${dailyRollups.totalCalls})::int`,
      successRate: sql`AVG(CAST(${dailyRollups.successRate} AS numeric))`,
      taskSuccessRate: sql`AVG(CAST(${dailyRollups.taskSuccessRate} AS numeric))`,
      p95: sql`AVG(${dailyRollups.p95LatencyMs})::int`
  }).from(dailyRollups).groupBy(dailyRollups.serviceDomain).orderBy(desc(sql`SUM(${dailyRollups.totalCalls})`)).limit(5);

  return (
    <div className="space-y-8 bg-[#0a0a0a] min-h-screen p-6 text-[#00ff00] font-mono selection:bg-[#00ff00] selection:text-black">
      <header className="border-b border-[#333] pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl tracking-widest font-bold uppercase text-[#00ff00]">COMPASS // API TRUST LEDGER</h1>
          <p className="text-[#888] text-xs mt-1">SYSTEM STATE: ONLINE | AGENT_SYNC: ACTIVE</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-[#00ff00]">CLAIMS VS REALITY</p>
          <p className="text-[#888]">NODE: US-EAST-1</p>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#888] mb-4">/// LEADERBOARD: AGGREGATE METRICS</h2>
        <div className="border border-[#333] bg-[#111] overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#00ff00] uppercase bg-[#1a1a1a] border-b border-[#333]">
              <tr>
                <th className="px-4 py-3 font-normal">SERVICE ID</th>
                <th className="px-4 py-3 font-normal text-right">VOL</th>
                <th className="px-4 py-3 font-normal text-right tracking-tighter">CLAIM (HTTP 200)</th>
                <th className="px-4 py-3 font-normal text-right tracking-tighter border-l border-[#333] bg-[#112211]">REALITY (TASK OK)</th>
                <th className="px-4 py-3 font-normal text-right">DELTA</th>
                <th className="px-4 py-3 font-normal text-right">P95 (MS)</th>
              </tr>
            </thead>
            <tbody>
              {topServices.length === 0 ? (
                 <tr><td colSpan={6} className="px-4 py-8 text-center text-[#555]">NO DATA / AWAITING INGEST</td></tr>
              ) : topServices.map((svc: any, i: number) => {
                const claim = Number(svc.successRate || 0);
                const reality = Number(svc.taskSuccessRate || 0);
                const delta = reality - claim;
                return (
                <tr key={i} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{svc.domain}</td>
                  <td className="px-4 py-3 text-right">{svc.calls}</td>
                  <td className="px-4 py-3 text-right text-[#00ff00]">{claim.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-bold border-l border-[#333] bg-[#112211] text-emerald-400">{reality.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-right ${delta < -10 ? 'text-red-500' : delta < -5 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-[#888]">{svc.p95 || '---'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-4 mt-12">
           <h2 className="text-sm font-bold uppercase tracking-wider text-[#888]">/// RAW INGEST: LIVE AGENT LOGS</h2>
           <span className="text-xs text-[#00ff00] animate-pulse">● REC RECORDING</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentReviews.map((log) => (
            <div key={log.id} className="border border-[#333] bg-[#111] p-3 text-xs flex flex-col justify-between hover:border-[#00ff00] transition-colors">
              <div>
                <div className="flex justify-between items-start border-b border-[#222] pb-2 mb-2">
                  <span className="font-bold text-white truncate pr-2">{log.serviceDomain}</span>
                  <span className="text-[#555] shrink-0">{new Date(log.createdAt).toISOString().split('T')[1].slice(0,8)}</span>
                </div>
                <div className="text-[#888] truncate mb-2" title={log.endpoint || ''}>{log.method} {log.endpoint?.split('?')[0] || '/'}</div>
                <div className="flex justify-between items-center py-1">
                   <span>AGENT</span>
                   <span className="text-[#00ff00]">{log.agentId}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                   <span>LATENCY</span>
                   <span className="text-white">{log.latencyMs}ms</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#222] grid grid-cols-2 gap-2">
                 <div className={`p-1 text-center font-bold ${log.success ? 'bg-[#003300] text-[#00ff00]' : 'bg-[#330000] text-red-500'}`}>
                    CLAIM: {log.statusCode}
                 </div>
                 <div className={`p-1 text-center font-bold ${log.taskSuccess ? 'bg-[#003300] text-emerald-400' : 'bg-[#330000] text-red-500'}`}>
                    REALITY: {log.taskSuccess ? 'PASS' : 'FAIL'}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
