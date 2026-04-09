'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Activity, Server, Clock, GitCommit, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type RollupInfo = {
    service_domain: string;
    service_name: string;
    avg_latency_ms: number;
    avg_reliability: number;
    total_reviews: number;
}

export default function CompassDashboard() {
    const [services, setServices] = useState<RollupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchCompassNetwork = async () => {
        setIsRefreshing(true);
        try {
            // Hot-wired directly into Icarus' Edge Node API (Relative path for single-repo)
            const response = await fetch('/api/services');
            if (!response.ok) throw new Error("API Edge Failure");
            
            const data = await response.json();
            
            if (data.services) {
                 setServices(data.services);
            }
            setApiError(null);
        } catch (e: any) {
            console.error("Compass API Desync:", e);
            setApiError("Failed to synchronize with Compass Agent ledger.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCompassNetwork();
        
        // Background polling loop to watch the agents execute
        const interval = setInterval(() => {
             fetchCompassNetwork();
        }, 15000);
        
        return () => clearInterval(interval);
    }, []);

    const totalReviews = services.reduce((acc, curr) => acc + (curr.total_reviews || 0), 0);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans p-8 md:p-12 lg:px-24">
            
            <header className="flex items-center justify-between border-b border-zinc-800 pb-8 mb-12 relative">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
                        <Compass className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Compass</h1>
                        <p className="text-zinc-500 text-sm font-mono tracking-wide mt-1">THE AGENTIC TRUST LEDGER</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-6">
                    <button 
                         onClick={fetchCompassNetwork} 
                         className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center text-sm font-mono"
                    >
                         <RefreshCw className={`w-4 h-4 mr-2 border-zinc-800 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                         Auto-Sync
                    </button>
                    <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center space-x-2 shadow-lg">
                        <span className="relative flex h-2 w-2">
                            {apiError ? <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span> : (
                                <>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </>
                            )}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 tracking-wider">
                            {apiError ? 'NETWORK DESYNC' : 'NETWORK ACTIVE'}
                        </span>
                    </div>
                </div>
            </header>

            {apiError && (
                <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg font-mono text-sm uppercase tracking-widest text-center">
                     {apiError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Active Agent Swarms", val: "2", icon: GitCommit, color: "text-blue-400" },
                    { label: "Global API Tests", val: totalReviews || "-", icon: Activity, color: "text-emerald-400" },
                    { label: "Providers Tracked", val: services.length || "-", icon: Server, color: "text-indigo-400" },
                    { label: "Ledger State", val: "Live", icon: Clock, color: "text-amber-400" }
                ].map((kpi, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                        <div className="flex items-center space-x-3 text-zinc-400 mb-4">
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                            <span className="text-xs font-semibold uppercase tracking-wider">{kpi.label}</span>
                        </div>
                        <div className="text-3xl font-light text-zinc-100">{kpi.val}</div>
                    </motion.div>
                ))}
            </div>

            <div>
                <h2 className="text-lg font-medium text-zinc-100 mb-6 flex items-center">
                   Global Provider Consensus Matrix 
                   <span className="ml-4 text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400 border border-zinc-700">Strictly Non-Simulated Telemetry</span>
                </h2>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-widest font-semibold">
                                <th className="pb-4 pl-4 font-mono">Service Domain</th>
                                <th className="pb-4 text-center">Task Reliability</th>
                                <th className="pb-4 pr-12 text-center">Avg Latency</th>
                                <th className="pb-4 pr-4 text-right">Logged Tests</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {isLoading ? (
                                    <tr><td colSpan={4} className="py-12 text-center text-zinc-600 font-mono animate-pulse">Syncing nodes from Compass Ledger...</td></tr>
                                ) : (
                                    services.map((api, index) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (index * 0.05) }}
                                            key={api.service_domain} 
                                            className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors group cursor-pointer"
                                        >
                                            <td className="py-5 pl-4 flex flex-col space-y-1">
                                                <Link href={`/services/${api.service_domain}`} className="text-zinc-200 font-medium hover:text-indigo-400 transition-colors">
                                                    {api.service_name}
                                                </Link>
                                                <span className="text-zinc-500 text-xs font-mono">{api.service_domain}</span>
                                            </td>
                                            
                                            <td className="py-5 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {(api.avg_reliability ?? 0) >= 4 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-amber-500" />}
                                                    <span className={(api.avg_reliability ?? 0) >= 4 ? 'text-emerald-400 font-mono text-sm' : 'text-amber-400 font-mono text-sm'}>
                                                        {(api.avg_reliability ?? 0).toFixed(1)} / 5
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-5 pr-12 text-center text-zinc-300 font-mono text-sm">
                                                {(api.avg_latency_ms ?? 0).toFixed(0)} <span className="opacity-50 text-xs">ms</span>
                                            </td>
                                            
                                            <td className="py-5 pr-4 text-right text-zinc-500 font-mono text-sm">
                                                {(api.total_reviews ?? 0).toLocaleString()}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
            
        </main>
    );
}
