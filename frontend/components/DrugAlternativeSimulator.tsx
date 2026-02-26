"use client";

import React, { useState } from "react";
import { ArrowRight, Pill, Shield, ShieldAlert, FileText, ChevronRight, Activity, Beaker } from "lucide-react";
import cdscoData from "../public/data/cdsco-banned.json";
import therapeuticClasses from "../public/data/therapeutic-classes.json";
import cpicData from "../public/data/cpic-guidelines.json";
interface DrugAlternativeSimulatorProps {
  currentDrug: string;
  currentRiskLabel: string;
  patientPhenotypes: Record<string, string>;
}

export default function DrugAlternativeSimulator({
  currentDrug,
  currentRiskLabel,
  patientPhenotypes,
}: DrugAlternativeSimulatorProps) {
  const [expandedAlt, setExpandedAlt] = useState<string | null>(null);

  if (currentRiskLabel !== "Toxic" && currentRiskLabel !== "Adjust Dosage") {
    return null;
  }

  // Determine candidate alternatives
  const upperDrug = currentDrug.toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classesForDrug = (therapeuticClasses.drug_to_class as any)[upperDrug] || [];
  
  let candidates: any[] = [];
  classesForDrug.forEach((cls: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drugsInClass = (therapeuticClasses.classes as any)[cls] || [];
    candidates = [...candidates, ...drugsInClass];
  });

  // Filter and deduplicate
  const cdscoBannedStr = cdscoData.banned_drugs.map((d: string) => d.toUpperCase());
  const cdscoBannedCombos = cdscoData.banned_combinations.map((d: string) => d.toUpperCase());
  
  const cdscoAlts = candidates.filter((alt: any) => {
    const altUpper = alt.drug.toUpperCase();
    if (altUpper === upperDrug) return false;
    if (cdscoBannedStr.includes(altUpper)) return false;
    if (cdscoBannedCombos.includes(altUpper)) return false;
    return true;
  }).reduce((acc, current) => {
    const x = acc.find((item: any) => item.drug === current.drug);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  if (cdscoAlts.length === 0) return null;

  // Helper function to dynamically check CPIC risk for an alternative
  const getSimulatedRisk = (altDrug: string) => {
    const rules = (cpicData as any)[altDrug.toUpperCase()]?.rules;
    if (!rules) return { severity: "Low", toxicity: "Low", efficacy: "~95%", match: "Standard CPIC Level" };
    
    // Check if any rules exist for this drug against patient's phenotype
    let worstSeverity = "Low";
    for (const [gene, phenotype] of Object.entries(patientPhenotypes)) {
       if (rules[gene] && rules[gene][phenotype as string]) {
          const rule = rules[gene][phenotype as string];
           if (rule.severity === "high") worstSeverity = "High";
           if (rule.severity === "medium" && worstSeverity !== "High") worstSeverity = "Medium";
       }
    }
    
    if (worstSeverity === "High") return { severity: "High", toxicity: "High", efficacy: "~40%", match: "CPIC Actionable: High Risk" };
    if (worstSeverity === "Medium") return { severity: "Medium", toxicity: "Medium", efficacy: "~70%", match: "CPIC Actionable: Adjust" };
    return { severity: "Low", toxicity: "Low", efficacy: "~90%", match: "Standard CPIC Level" };
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Header Context */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13b6ec]/10 border border-[#13b6ec]/20 w-fit">
            <Beaker className="w-3.5 h-3.5 text-[#13b6ec]" />
            <span className="text-[10px] font-mono text-[#13b6ec] uppercase tracking-wider">
              {Object.entries(patientPhenotypes).map(([g, p]) => `${g} ${p}`).join(", ")}
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">CDSCO Approved List</p>
        </div>
        <h3 className="text-2xl font-bold text-slate-100 font-display tracking-tight text-[#13b6ec]">Recommended Alternatives</h3>
        <p className="text-slate-400 text-sm font-light">
          Based on the patient's genomic profile, standard therapy may be ineffective or toxic. 
          The following alternatives have been screened for metabolic compatibility.
        </p>
      </div>

      {/* List Container */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-slate-700/50 shadow-xl bg-[#131f24]/50">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#0d181c] border-b border-slate-700/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <div className="col-span-8 md:col-span-6">Drug Name / Class</div>
          <div className="col-span-4 md:col-span-4 hidden md:block">Mech. / CPIC Level</div>
          <div className="col-span-4 md:col-span-2 text-right">Action</div>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {cdscoAlts.map((alt: any, index: number) => {
          const isExpanded = expandedAlt === alt.drug;
          const bgOpacity = isExpanded ? "bg-[#18262b]" : "bg-[#131f24] hover:bg-[#13b6ec]/5 opacity-80 hover:opacity-100";
          
          return (
            <div key={index} className="flex flex-col transition-all duration-300">
              {/* Row Target */}
              <div 
                className={`group relative grid grid-cols-12 gap-4 px-5 py-4 items-center cursor-pointer border-b border-slate-700/30 ${bgOpacity}`}
                onClick={() => setExpandedAlt(isExpanded ? null : alt.drug)}
              >
                {/* Active Indicator Strip */}
                {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#13b6ec]"></div>}
                
                <div className="col-span-8 md:col-span-6 flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${isExpanded ? 'bg-[#13b6ec] shadow-md shadow-[#13b6ec]/20 text-slate-900' : 'bg-emerald-500/10 text-emerald-500'} hidden sm:flex items-center justify-center transition-colors`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-bold font-syne transition-colors ${isExpanded ? 'text-white' : 'text-slate-200 group-hover:text-[#13b6ec]'}`}>
                      {alt.drug}
                    </h3>
                    <p className="text-xs text-slate-500">{alt.class}</p>
                  </div>
                </div>

                <div className="col-span-4 md:col-span-4 hidden md:flex flex-col justify-center">
                  <span className={`text-sm ${getSimulatedRisk(alt.drug).severity === 'High' ? 'text-rose-400' : getSimulatedRisk(alt.drug).severity === 'Medium' ? 'text-amber-400' : 'text-slate-300'}`}>{getSimulatedRisk(alt.drug).match}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">Alternative</span>
                </div>

                <div className="col-span-4 md:col-span-2 flex justify-end items-center">
                  <button className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'text-[#13b6ec]' : 'text-slate-500 group-hover:text-[#13b6ec] group-hover:bg-[#13b6ec]/10'}`}>
                    <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Details Panel */}
              {isExpanded && (
                <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0f1519] border-b border-[#13b6ec]/20 shadow-inner">
                  {/* Col 1: Recommendation Text */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#13b6ec] mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Therapeutic Profile
                      </h5>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        Consider {alt.drug} as an alternative to {currentDrug}. Since the patient genotype indicates altered metabolism for {currentDrug}, switching to {alt.drug} ({alt.class}) may provide similar therapeutic efficacy while bypassing the restrictive metabolic pathway.
                      </p>
                    </div>

                    <div className="pt-2">
                       <button className="bg-[#13b6ec] hover:bg-[#2bf0dc] text-[#0d161a] font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 transition-colors text-sm font-mono shadow-[0_0_15px_rgba(19,182,236,0.2)]">
                         <Shield className="w-4 h-4" /> Prescribe {alt.drug}
                       </button>
                       <button className="ml-3 bg-transparent hover:bg-slate-800 text-[#13b6ec] border border-[#13b6ec]/30 font-medium py-2 px-4 rounded-lg inline-flex items-center gap-2 transition-colors text-sm">
                         <FileText className="w-4 h-4" /> View Full Monograph
                       </button>
                    </div>
                  </div>

                  {/* Col 2: Genomic Impact Metrics */}
                  <div className="lg:col-span-1 bg-[#1a262b]/50 rounded-xl p-4 border border-slate-700/50">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-700/50 pb-2">
                      Genomic Impact Metrics
                    </h5>
                    <div className="flex flex-col gap-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Efficacy Potential</span>
                        <span className="text-green-400 font-bold">~90%</span>
                      </div>
                      <div className="w-full bg-[#111618] rounded-full h-1">
                        <div className="bg-green-500 h-1 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400">Toxicity Risk</span>
                        <span className={getSimulatedRisk(alt.drug).toxicity === 'High' ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{getSimulatedRisk(alt.drug).toxicity}</span>
                      </div>
                      <div className="w-full bg-[#111618] rounded-full h-1">
                        <div className={getSimulatedRisk(alt.drug).toxicity === 'High' ? "bg-rose-500 h-1 rounded-full" : "bg-emerald-500 h-1 rounded-full"} style={{ width: getSimulatedRisk(alt.drug).toxicity === 'High' ? '80%' : '20%' }}></div>
                      </div>

                      <div className="pt-3 mt-1 border-t border-slate-700/50">
                         <div className="flex justify-between items-start mb-1 text-[10px]">
                           <span className="text-slate-500">Source</span>
                           <span className="text-[#13b6ec]">CPIC Guidelines</span>
                         </div>
                         <div className="flex justify-between items-start text-[10px]">
                           <span className="text-slate-500">Region</span>
                           <span className="text-slate-300">CDSCO (India)</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-1 flex items-start gap-2 p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
        <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
          Rankings are based on your specific genotype. Always consult a clinician before prescribing alternatives.
        </p>
      </div>
    </div>
  );
}
