"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import { ArrowLeft, Share2, Download, ThumbsUp, ThumbsDown, AlertTriangle, Pill, Brain, Gauge, Dna, UserCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";


interface RiskEngineSummaryDashboardProps {
  result: AnalysisResult;
}

export default function RiskEngineSummaryDashboard({ result }: RiskEngineSummaryDashboardProps) {
  const { t } = useTranslation();
  const isHighRisk = result.risk_assessment.risk_label === "Toxic" || result.risk_assessment.severity === "critical";


  return (
    <div className="flex-1 w-full animate-fade-in font-display">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">{t('dashboard.risk_overview')}</h1>

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
            <p>{t('dashboard.patient_id')}: <span className="font-mono text-slate-300">{result.patient_id || "PT-49202-X"}</span></p>
            <span className="mx-2 opacity-50">|</span>
            <p>{t('dashboard.cpic_drug')}: <span className="font-mono text-[#13b6ec]">{result.drug}</span></p>
          </div>

        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition-colors">
            <Share2 className="w-4 h-4" />
            {t('dashboard.share')}
          </button>

          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#13b6ec] hover:bg-[#13b6ec]/90 text-[#101d22] text-sm font-bold shadow-lg shadow-[#13b6ec]/20 transition-all">
            <Download className="w-4 h-4" />
            {t('dashboard.export')}
          </button>

        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Span 8) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Main Alert Card */}
          <div className={`relative overflow-hidden rounded-xl bg-[#18282e] border shadow-xl ${isHighRisk ? 'border-red-500/30' : 'border-slate-700/50'}`}>
            {isHighRisk && <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>}
            
            <div className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${isHighRisk ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#13b6ec]/10 text-[#13b6ec] border-[#13b6ec]/20'}`}>
                    {isHighRisk && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {isHighRisk ? t('dashboard.high_priority_alert') : t('dashboard.standard_advisory')}
                  </div>

                </div>
                <div className="flex gap-2">
                  <button className="text-slate-400 hover:text-white transition-colors"><ThumbsUp className="w-4 h-4" /></button>
                  <button className="text-slate-400 hover:text-white transition-colors"><ThumbsDown className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-4">{result.risk_assessment.risk_label} {t('dashboard.detected')}</h2>

                  <p className="text-slate-400 text-lg leading-relaxed mb-6">
                    {result.risk_assessment.clinical_recommendation}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="px-3 py-1.5 rounded bg-[#142227] border border-[#283539] text-xs text-slate-400 font-mono">{result.pharmacogenomic_profile.primary_gene}</span>
                    <span className="px-3 py-1.5 rounded bg-[#142227] border border-[#283539] text-xs text-slate-400 font-mono">Pharmacokinetics</span>
                  </div>
                </div>

                {isHighRisk && (
                  <div className="hidden md:flex flex-col items-center justify-center p-6 bg-[#142227] rounded-xl border border-[#283539] min-w-[180px]">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
                    <span className="text-red-500 font-bold text-xl tracking-tight uppercase">Toxic Risk</span>
                    <span className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{result.risk_assessment.severity}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#283539] flex justify-between items-center">
                <span className="text-sm text-slate-500">{t('dashboard.confidence')}: {(result.risk_assessment.confidence_score * 100).toFixed(1)}%</span>
                <button className="text-[#13b6ec] hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
                  {t('dashboard.view_clinical_guidelines')} 
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          </div>

          {/* Clinical Impact Section */}
          <div className="bg-[#18282e] rounded-xl p-6 border border-[#283539]">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13b6ec]">monitor_heart</span>
              {t('dashboard.clinical_impact_analysis')}
            </h3>


            <div className="mt-6">
              <div className="w-full bg-[#142227] h-64 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 flex items-end justify-between px-8 pb-8 gap-4 opacity-80">
                  <div className="w-full bg-[#13b6ec]/20 h-[30%] rounded-t-sm relative group-hover:h-[35%] transition-all duration-500">
                    <div className="absolute -top-6 left-0 w-full text-center text-xs text-slate-500">Normal</div>
                  </div>
                  <div className={`w-full ${isHighRisk ? 'bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-amber-500/80'} h-[85%] rounded-t-sm relative group-hover:h-[90%] transition-all duration-500`}>
                    <div className={`absolute -top-6 left-0 w-full text-center text-xs font-bold ${isHighRisk ? 'text-red-500' : 'text-amber-500'}`}>Patient</div>
                  </div>
                  <div className="w-full bg-[#13b6ec]/20 h-[45%] rounded-t-sm relative group-hover:h-[40%] transition-all duration-500">
                    <div className="absolute -top-6 left-0 w-full text-center text-xs text-slate-500">Population</div>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('dashboard.exposure_levels')}</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metrics & Tech Details (Span 4) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#18282e] p-5 rounded-xl border border-[#283539] flex flex-col justify-between h-32 hover:border-[#13b6ec]/50 transition-colors group">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-slate-500">{t('dashboard.confidence')}</p>
                <Gauge className="w-5 h-5 text-slate-600 group-hover:text-[#13b6ec] transition-colors" />

              </div>
              <p className="text-4xl font-mono font-bold text-white tracking-tight">{result.risk_assessment.confidence_score.toFixed(2)}</p>
            </div>

            <div className="bg-[#18282e] p-5 rounded-xl border border-[#283539] flex flex-col justify-between h-32 hover:border-[#13b6ec]/50 transition-colors group">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-slate-500">Diplotype</p>
                <Dna className="w-5 h-5 text-slate-600 group-hover:text-[#13b6ec] transition-colors" />
              </div>
              <p className="text-xl font-mono font-bold text-white tracking-tight leading-tight">{result.pharmacogenomic_profile.diplotype || "Unknown"}</p>
            </div>

            <div className="col-span-2 bg-[#18282e] p-5 rounded-xl border border-[#283539] flex flex-col justify-between hover:border-[#13b6ec]/50 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">{t('dashboard.phenotype_classification')}</p>
                <UserCircle className="w-5 h-5 text-slate-600 group-hover:text-[#13b6ec] transition-colors" />

              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-white tracking-tight">{result.pharmacogenomic_profile.phenotype}</p>
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2 py-1 rounded font-mono">
                  {result.pharmacogenomic_profile.phenotype?.split(" ").map(w => w[0]).join("") || "UNK"}
                </span>
              </div>
              
              <div className="w-full bg-[#142227] h-2 rounded-full mt-4 overflow-hidden flex">
                <div className={`${isHighRisk ? 'bg-red-500' : 'bg-amber-500'} h-full w-[25%]`}></div>
                <div className="bg-[#142227] h-full w-[25%] border-l border-[#18282e]"></div>
                <div className="bg-[#142227] h-full w-[25%] border-l border-[#18282e]"></div>
                <div className="bg-[#142227] h-full w-[25%] border-l border-[#18282e]"></div>
              </div>
            </div>
          </div>

          <div className="bg-[#18282e] rounded-xl border border-[#283539] overflow-hidden flex-1">
            <div className="p-4 border-b border-[#283539] bg-[#142227] flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">{t('dashboard.genomic_details')}</h3>
              <span className="text-xs text-slate-500 font-mono">RSID MAP</span>

            </div>
            <div className="divide-y divide-[#283539] max-h-[300px] overflow-y-auto">
              {result.pharmacogenomic_profile.detected_variants.map((v, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-[#142227]/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-mono">{v.rsid}</span>
                    <span className="text-sm font-medium text-white">{v.star_allele}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 font-mono">Pos</span>
                    <span className="text-sm text-slate-300 font-medium">{v.position}</span>
                  </div>
                </div>
              ))}
              {result.pharmacogenomic_profile.detected_variants.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-xs">No specific target variants logged.</div>
              )}
            </div>
            <div className="p-4 bg-[#142227]/30">
              <button className="w-full py-2 text-xs font-bold uppercase tracking-wider text-[#13b6ec] border border-[#13b6ec]/20 rounded hover:bg-[#13b6ec]/10 transition-colors">
                {t('dashboard.view_full_variant_table')}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
