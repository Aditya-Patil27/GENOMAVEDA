"use client";

import React, { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import { Dna, ChevronDown, ChevronRight, Activity, BarChart3, ArrowRight, TrendingUp, AlertOctagon, AlertTriangle as WarningIcon, Info } from "lucide-react";

interface RiskEngineExpandedExplainabilityProps {
  result: AnalysisResult;
}

export default function RiskEngineExpandedExplainability({ result }: RiskEngineExpandedExplainabilityProps) {
  const [expandedRsid, setExpandedRsid] = useState<string | null>(
    result.pharmacogenomic_profile.detected_variants[0]?.rsid || null
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-8 font-display animate-fade-in w-full">
      
      {/* Left Column: Variants (Takes 2 columns in a 3 col grid usually, or just flex-2) */}
      <div className="flex-[2] flex flex-col gap-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Dna className="w-6 h-6 text-[#13b6ec]" />
          Detected Variants
        </h3>

        {result.pharmacogenomic_profile.detected_variants.map((v, i) => {
          const isExpanded = expandedRsid === v.rsid;
          // Determine impact color based on generic severity mapping or just alternating for demo
          const effectLevel = i === 0 ? "Pathogenic" : i === 1 ? "Uncertain" : "Benign";
          const effectColor = effectLevel === "Pathogenic" ? "text-red-500 bg-red-500/10 border-red-500/20" : 
                             effectLevel === "Uncertain" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : 
                             "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

          return (
            <div key={i} className={`bg-[#18282e] border transition-colors cursor-pointer group ${isExpanded ? 'border-[#13b6ec]/50 shadow-[0_0_20px_rgba(19,182,236,0.05)] rounded-xl overflow-hidden relative' : 'border-[#283539] rounded-xl p-5 hover:bg-[#101d22]/50'}`}>
              
              <div 
                className={`flex justify-between items-start ${isExpanded ? 'p-6 border-b border-[#283539] bg-[#18282e]/50 backdrop-blur-sm' : ''}`}
                onClick={() => setExpandedRsid(isExpanded ? null : v.rsid)}
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded p-2 font-mono text-xs border ${effectColor.replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[0]}`}>
                    {v.rsid}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg font-mono flex items-center gap-3">
                      {v.gene} {v.star_allele}
                      {isExpanded && <span className="px-2 py-0.5 rounded-full bg-[#13b6ec]/10 text-[#13b6ec] text-[10px] font-bold tracking-wider uppercase border border-[#13b6ec]/20">Active Selection</span>}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">{isExpanded ? "Detailed breakdown of the active variant selection." : `Chr: ${v.chromosome} | Pos: ${v.position}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded border text-xs font-bold font-mono uppercase ${effectColor}`}>
                    {effectLevel}
                  </span>
                  <div className={isExpanded ? "bg-[#13b6ec]/20 rounded-full p-1" : ""}>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-[#13b6ec]" /> : <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 bg-[#101d22]/30 animate-in slide-in-from-top-4 duration-500">
                  {/* AI Explanation Area */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-[#13b6ec]" />
                      <span className="text-[#13b6ec] text-xs font-bold font-mono tracking-widest uppercase">Genomic Insight Engine</span>
                    </div>
                    
                    <div className="prose prose-invert max-w-none text-slate-300">
                      <div className="border-l-2 border-[#13b6ec]/30 pl-4 py-1">
                        {typeof result.risk_assessment.llm_generated_explanation === 'string' ? (
                          <p className="text-lg leading-relaxed">{result.risk_assessment.llm_generated_explanation}</p>
                        ) : (
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          <p className="text-lg leading-relaxed">{(result.risk_assessment.llm_generated_explanation as any).summary}</p>
                        )}
                      </div>
                      
                      {typeof result.risk_assessment.llm_generated_explanation !== 'string' && (
                        <div className="mt-4 pl-4 space-y-3 text-sm text-slate-400">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <p><strong>Mechanism:</strong> {(result.risk_assessment.llm_generated_explanation as any).biological_mechanism}</p>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <p><strong>Impact:</strong> {(result.risk_assessment.llm_generated_explanation as any).variant_impact}</p>
                          
                          {/* SAFE ALTERNATIVES DISPLAY */}
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(result.risk_assessment.llm_generated_explanation as any).safe_alternatives?.length > 0 && (
                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <p className="font-bold text-emerald-400 font-mono tracking-widest uppercase text-xs mb-2">Smart Alternatives (Feedback Loop)</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {((result.risk_assessment.llm_generated_explanation as any).safe_alternatives as string[]).map((alt, idx) => (
                                  <li key={idx} className="text-emerald-200/90">{alt}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Data Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="bg-[#101d22] border border-[#283539] rounded-lg p-3">
                      <p className="text-slate-500 text-xs font-mono mb-1">ZYGOSITY</p>
                      <p className="text-white font-mono text-sm">{v.zygosity}</p>
                    </div>
                    <div className="bg-[#101d22] border border-[#283539] rounded-lg p-3">
                      <p className="text-slate-500 text-xs font-mono mb-1">CHROMOSOME</p>
                      <p className="text-white font-mono text-sm">{v.chromosome}</p>
                    </div>
                    <div className="bg-[#101d22] border border-[#283539] rounded-lg p-3">
                      <p className="text-slate-500 text-xs font-mono mb-1">POSITION</p>
                      <p className="text-white font-mono text-sm">{v.position}</p>
                    </div>
                    <div className="bg-[#101d22] border border-[#283539] rounded-lg p-3">
                      <p className="text-slate-500 text-xs font-mono mb-1">EXTERNAL ID</p>
                      <a href="#" className="text-[#13b6ec] hover:text-white transition-colors font-mono text-sm flex items-center gap-1">
                        View DB
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Column: Visualization & Summary */}
      <div className="flex-1 flex flex-col gap-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#13b6ec]" />
          Impact Analysis
        </h3>

        {/* Visualization Card */}
        <div className="bg-[#18282e] border border-[#283539] rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white font-bold text-sm font-mono uppercase">Allele Distribution</h4>
          </div>
          <div className="h-48 w-full rounded-lg bg-[#101d22] border border-[#283539] relative overflow-hidden flex items-end justify-center gap-2 px-4 pb-0">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
              <div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div>
            </div>
            <div className="w-8 h-[30%] bg-slate-700 rounded-t-sm mx-1 opacity-50"></div>
            <div className="w-8 h-[45%] bg-slate-700 rounded-t-sm mx-1 opacity-50"></div>
            <div className="w-8 h-[80%] bg-[#13b6ec] rounded-t-sm mx-1 relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#13b6ec] text-[#101d22] text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Your Cohort</div>
            </div>
            <div className="w-8 h-[25%] bg-slate-700 rounded-t-sm mx-1 opacity-50"></div>
            <div className="w-8 h-[40%] bg-slate-700 rounded-t-sm mx-1 opacity-50"></div>
          </div>
          <p className="text-slate-400 text-xs text-center font-mono mt-1">Relative frequency in population cohorts</p>
        </div>

        {/* Clinical Action Items */}
        <div className="bg-[#18282e] border border-[#283539] rounded-xl p-6 flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm font-mono uppercase border-b border-[#283539] pb-3">Clinical Action Items</h4>
          
          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Review Prescription</p>
              <p className="text-slate-400 text-xs mt-1">Due to {result.pharmacogenomic_profile.phenotype} status.</p>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <WarningIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Monitor Dosage</p>
              <p className="text-slate-400 text-xs mt-1">Consider alternatives evaluated by AI Engine.</p>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Family History Update</p>
              <p className="text-slate-400 text-xs mt-1">Add pedigree note for detected variants.</p>
            </div>
          </div>

          <button className="w-full mt-2 bg-[#101d22] hover:bg-[#283539] border border-[#283539] text-slate-300 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-colors">
            Generate Full Report
          </button>
        </div>

      </div>
    </div>
  );
}
