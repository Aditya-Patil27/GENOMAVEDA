"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Search, Filter, TrendingUp, Activity, Dna } from "lucide-react";

export default function VusDiscovery() {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAnalyzing(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            Variants of Unknown Significance (VUS) Discovery Engine
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulated demo view of how an unsupervised clustering engine could monitor unmapped genetic mutations across a cohort
            and correlate VUS presence with elevated Adverse Drug Reactions (ADRs). Metrics below are illustrative only, not live patient data.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
             <Filter className="w-4 h-4" />
             Filter Confidence &gt; 80%
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Monitored VUS (simulated)</p>
           <p className="text-3xl font-bold text-slate-100">14,293</p>
           <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +124 this week</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Emerging Clusters (simulated)</p>
           <p className="text-3xl font-bold text-slate-100">3</p>
           <p className="text-xs text-amber-400 mt-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Requiring clinical review</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-center">
           <AlertCircle className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
           <p className="text-xs text-slate-400 font-semibold tracking-wide">AI PREDICTION CONFIDENCE</p>
           <p className="text-lg font-bold text-slate-200">High (&gt;88%)</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h4 className="font-semibold text-slate-200">Emerging VUS to ADR Correlations</h4>
        </div>
        
        {analyzing ? (
          <div className="p-12 flex flex-col items-center justify-center">
             <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
             <p className="text-slate-400 text-sm animate-pulse">Running cluster analysis on 124,000 patient records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 border-b border-slate-700 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Variant (rsID / Pos)</th>
                  <th className="px-6 py-3">Gene</th>
                  <th className="px-6 py-3">Correlated Drug</th>
                  <th className="px-6 py-3">Reported ADR</th>
                  <th className="px-6 py-3">Patient Cohort</th>
                  <th className="px-6 py-3">AI Confidence</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-purple-400 flex items-center gap-2"><Dna className="w-4 h-4" /> rs12345678</td>
                  <td className="px-6 py-4 text-slate-300">CYP2C19</td>
                  <td className="px-6 py-4 text-slate-300">Clopidogrel</td>
                  <td className="px-6 py-4 text-red-400 font-medium">Internal Bleeding</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">n=542</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">94%</td>
                  <td className="px-6 py-4"><button className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-500/30 transition">Investigate</button></td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-purple-400 flex items-center gap-2"><Dna className="w-4 h-4" /> chr10:97547963</td>
                  <td className="px-6 py-4 text-slate-300">DPYD</td>
                  <td className="px-6 py-4 text-slate-300">Fluorouracil</td>
                  <td className="px-6 py-4 text-amber-400 font-medium">Severe Toxicity</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">n=128</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">88%</td>
                  <td className="px-6 py-4"><button className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-500/30 transition">Investigate</button></td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-purple-400 flex items-center gap-2"><Dna className="w-4 h-4" /> rs98765432</td>
                  <td className="px-6 py-4 text-slate-300">SLCO1B1</td>
                  <td className="px-6 py-4 text-slate-300">Simvastatin</td>
                  <td className="px-6 py-4 text-slate-300">Myopathy</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">n=89</td>
                  <td className="px-6 py-4 text-amber-400 font-bold">62%</td>
                  <td className="px-6 py-4"><button className="text-xs bg-slate-700 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-600 transition">Monitor</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
