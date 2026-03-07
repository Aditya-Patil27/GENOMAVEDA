"use client";

import React from "react";
import { Map, Users, AlertTriangle, TrendingDown } from "lucide-react";

export default function PopulationHeatmap() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            Population-Level Pharmacovigilance
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Aggregated demographic and geographic heatmap of metaboliser phenotypes. Allows pharma companies and policymakers to optimize drug distribution and clinical trial diversity based on regional genetic profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mock Map View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <span className="font-semibold text-slate-200 text-sm">Global Distribution: CYP2C19 Poor Metabolizers</span>
            <select className="bg-slate-800 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1 outline-none">
               <option>CYP2C19 (Clopidogrel)</option>
               <option>CYP2D6 (Codeine)</option>
               <option>SLCO1B1 (Statins)</option>
            </select>
          </div>
          <div className="flex-1 bg-[#0b131a] relative p-8 flex items-center justify-center min-h-[350px]">
            {/* Very simple CSS representation of a map / hotspots */}
            <div className="absolute inset-0 bg-[url('/assets/image/map-placeholder.svg')] bg-center bg-no-repeat bg-contain opacity-20"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full z-10">
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg backdrop-blur-sm text-center">
                 <p className="text-slate-300 text-sm font-semibold mb-1">South Asia</p>
                 <p className="text-red-400 font-bold text-2xl">~38%</p>
                 <p className="text-xs text-red-300 mt-1">High Risk Region</p>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-lg backdrop-blur-sm text-center">
                 <p className="text-slate-300 text-sm font-semibold mb-1">East Asia</p>
                 <p className="text-amber-400 font-bold text-2xl">~15%</p>
                 <p className="text-xs text-amber-300 mt-1">Elevated Risk</p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-lg backdrop-blur-sm text-center">
                 <p className="text-slate-300 text-sm font-semibold mb-1">Europe</p>
                 <p className="text-emerald-400 font-bold text-2xl">~3%</p>
                 <p className="text-xs text-emerald-300 mt-1">Low Risk</p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-lg backdrop-blur-sm text-center">
                 <p className="text-slate-300 text-sm font-semibold mb-1">North America</p>
                 <p className="text-emerald-400 font-bold text-2xl">~4%</p>
                 <p className="text-xs text-emerald-300 mt-1">Low Risk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col">
          <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
            <TrendingDown className="w-4 h-4 text-blue-400" />
            AI Discovered Insights
          </h4>
          
          <div className="space-y-4 flex-1">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Action Required</p>
              <p className="text-sm text-slate-300">Clopidogrel presents a significantly elevated failure rate in South Asian demographics due to high prevalence of CYP2C19 Poor Metaboliser phenotypes.</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Recommendation: Shift regional formulary to Prasugrel or Ticagrelor.</p>
            </div>
            
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Trial Diversity Alert</p>
              <p className="text-sm text-slate-300">Phase III trials for Experimental Drug X lack sufficient representation of CYP2D6 Ultra-Rapid Metabolisers (common in MENA region).</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
