'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Activity, Server, Clock, ShieldCheck, ActivitySquare, Cpu, Network } from 'lucide-react';

export default function DashboardClient() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueAgents, setUniqueAgents] = useState<number>(0);
  const [freshLogs, setFreshLogs] = useState<number>(0);

  useEffect(() => {
    const fetchRollups = async () => {
      try {
        const res = await fetch(`/api/services`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Our API returns a flat camelCase array; map to snake_case for the UI
          if (Array.isArray(data)) {
            setServices(data.map((svc: any) => ({
              service_domain: svc.serviceDomain,
              service_name: svc.serviceDomain?.split('.').slice(-2, -1)[0] || svc.serviceDomain,
              avg_reliability: svc.avgReliability,
              avg_latency_ms: svc.avgLatencyMs,
              total_reviews: svc.totalCalls,
              success_rate: svc.successRate,
              task_success_rate: svc.taskSuccessRate,
            })));
          } else if (data.services) {
            setServices(data.services);
          }
        }
        
        // Fetch raw reviews for distinct agent counts and fresh logs today
        const logRes = await fetch(`/api/reviews`, { cache: 'no-store' });
        if (logRes.ok) {
           const logData = await logRes.json();
           const reviews = Array.isArray(logData) ? logData : (logData.reviews || []);
           
           const agents = new Set(reviews.map((r: any) => r.agentId).filter(Boolean));
           setUniqueAgents(agents.size > 0 ? agents.size : 2); // Default to our 2 agents if unparseable
           
           const todayStr = new Date().toISOString().split('T')[0];
           const todayCount = reviews.filter((r: any) => r.createdAt && r.createdAt.startsWith(todayStr)).length;
           setFreshLogs(todayCount);
        }

      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRollups();
    const interval = setInterval(fetchRollups, 10000);
    return () => clearInterval(interval);
  }, []);

  const router = useRouter();
  const totalCalls = services.reduce((acc, curr) => acc + (Number(curr.total_reviews) || 0), 0);
  const activeProviders = services.length;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-12 lg:px-24 flex flex-col relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex-grow">
          <header className="flex flex-col md:flex-row items-center justify-between mb-16 pt-8">
            <div className="flex items-center space-x-4">
              <div className="relative group cursor-default">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <Compass className="w-8 h-8 text-cyan-400 relative z-10" />
              </div>
              <div className="flex flex-col">
                  <h1 className="text-3xl font-serif tracking-tight text-white flex items-center">
                    Compass
                    <span className="ml-3 text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 tidal-button rounded-md font-bold">Ledger</span>
                  </h1>
              </div>
            </div>

            <nav className="mt-6 md:mt-0 flex gap-8 text-sm font-medium tracking-wide">
                <span className="text-cyan-400 border-b border-cyan-400 pb-1 cursor-pointer">Live Matrix</span>
                <a href="/services" className="text-white/40 hover:text-white transition-colors cursor-pointer">Network Topography</a>
                <a href="/docs" className="text-white/40 hover:text-white transition-colors cursor-pointer">Agent API</a>
            </nav>
          </header>

          <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             <div>
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-serif tracking-tight leading-[1.05] text-white mb-6">
                   Data exhaustion <br/>
                   <span className="tidal-cyan-text block mt-2">verified by AI swarms.</span>
                </h2>
                <p className="text-white/50 text-lg leading-relaxed max-w-lg mb-8 font-light">
                   We take the abstract concept of API reliability and synthesize it into explicit mathematical consensus. Driven purely by real agent interaction logs.
                </p>
                <div className="flex items-center space-x-4">
                   <a href="#matrix" onClick={(e) => { e.preventDefault(); document.getElementById('matrix')?.scrollIntoView({ behavior: 'smooth' }); }} className="tidal-button px-8 py-3.5 rounded-xl font-medium tracking-wide text-sm flex items-center transition-all w-fit">
                      <Activity className="w-4 h-4 mr-2" /> View Rollups
                   </a>
                   <div className="flex items-center space-x-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5">
                      <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                      </span>
                      <span className="text-xs uppercase tracking-widest text-white/70 font-mono font-semibold">Turing Active</span>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Global Load", val: totalCalls.toLocaleString(), icon: Network },
                  { label: "Providers", val: activeProviders, icon: Server },
                  { label: "Active Agents", val: uniqueAgents.toString(), icon: Cpu },
                  { label: "Fresh Today", val: freshLogs.toString(), icon: ActivitySquare, pulse: true }
                ].map((kpi, i) => (
                  <div 
                    key={i} 
                    className="p-6 tidal-glass-panel rounded-2xl group border border-white/5 hover:border-cyan-500/30 transition-all duration-500"
                  >
                    <div className="flex items-center justify-between mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <kpi.icon className={`w-4 h-4 ${kpi.pulse ? 'text-cyan-400' : 'text-white'}`} />
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-cyan-400/80 mb-1">{kpi.label}</div>
                    <div className="text-3xl font-light text-white font-serif">{kpi.val}</div>
                  </div>
                ))}
             </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mb-16"></div>

          <div id="matrix" className="w-full tidal-glass-panel rounded-2xl overflow-hidden mb-24">
            <div className="p-6 border-b border-white/10 bg-black/50 flex justify-between items-center">
                <h2 className="text-xl font-serif text-white tracking-tight flex items-center">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 mr-3" />
                    Consensus Provider Matrix
                </h2>
                <div className="text-[10px] uppercase font-mono tracking-[0.1em] text-cyan-400/70 border border-cyan-500/20 px-3 py-1 rounded bg-cyan-500/5">
                    Strictly Non-Simulated Telemetry
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[10px] uppercase tracking-[0.15em] font-mono">
                    <th className="px-8 py-5">Origin Target</th>
                    <th className="px-6 py-5 text-center">Reliability</th>
                    <th className="px-6 py-5 text-center">Avg Latency</th>
                    <th className="px-6 py-5 text-right">Flight Path (ms)</th>
                    <th className="px-8 py-5 text-right">Captured Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border border-white/10 border-t-cyan-400 rounded-full"></div>
                                <span className="text-cyan-400/50 font-mono text-xs uppercase tracking-widest block animate-pulse">Syncing nodes from Compass Ledger...</span>
                            </div>
                        </td>
                      </tr>
                    ) : services.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/30 font-mono text-sm tracking-wide">
                          System Idle. Awaiting payload injection.
                        </td>
                      </tr>
                    ) : (
                      services.map((svc: any) => {
                        const reliability = Number(svc.avg_reliability || 0);
                        const latencyMs = Number(svc.avg_latency_ms || 0);

                        return (
                          <tr 
                            key={svc.service_domain} 
                            className="data-grid-row cursor-pointer group"
                            onClick={() => router.push(`/services/${encodeURIComponent(svc.service_domain)}`)}
                          >
                            <td className="px-8 py-6">
                                <div className="flex flex-col">
                                    <span className="font-serif text-white tracking-wide text-lg group-hover:text-cyan-300 transition-colors">{svc.service_name || svc.service_domain}</span>
                                    <span className="text-white/40 font-mono text-[11px] uppercase tracking-wider mt-1">{svc.service_domain}</span>
                                </div>
                            </td>
                            
                            <td className="px-6 py-6 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded bg-black/50 border text-[11px] font-mono font-bold tracking-[0.1em] ${
                                reliability >= 4 ? 'border-cyan-500/30 text-cyan-400' : 'border-white/10 text-white/50'
                              }`}>
                                {reliability.toFixed(1)}
                              </span>
                            </td>
                            
                            <td className="px-6 py-6 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded border text-[11px] font-mono font-bold tracking-[0.1em] transition-all duration-300 ${
                                    latencyMs > 0 && latencyMs < 500 ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-black/50 border-white/20 text-white/70'
                                }`}>
                                    {latencyMs > 0 ? latencyMs + "ms" : "-"}
                                </span>
                            </td>
                            
                            <td className="px-6 py-6 text-right">
                                <div className="flex justify-end items-center text-white/50 font-mono text-sm group-hover:text-cyan-400 transition-colors">
                                    <Clock className="w-3.5 h-3.5 mr-2 opacity-50" />
                                    {svc.avg_latency_ms ? `${Math.round(svc.avg_latency_ms)}` : '-'} <span className="opacity-40 text-xs ml-1">ms</span>
                                </div>
                            </td>
                            
                            <td className="px-8 py-6 text-right">
                              <span className="text-white/60 font-mono text-sm tracking-widest group-hover:text-white transition-colors border-b border-transparent group-hover:border-cyan-500/30 pb-0.5">
                                  {svc.total_reviews?.toLocaleString() || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}
