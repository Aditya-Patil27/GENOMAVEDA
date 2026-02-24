"use client";

import React from "react";
import { ArrowRight, Shield, ShieldAlert, ShieldX, Info } from "lucide-react";
import cdscoData from "@/../public/data/cdsco-banned.json";

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
  // Only show for Toxic or Adjust Dosage results
  if (currentRiskLabel !== "Toxic" && currentRiskLabel !== "Adjust Dosage") {
    return null;
  }

  const cdscoAlts = (cdscoData.alternatives as any)[currentDrug] || [];

  if (cdscoAlts.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="w-4 h-4 text-teal-400" />
        <h4 className="text-sm font-semibold text-teal-400">
          Find a Safer Alternative
        </h4>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          client-side • &lt;100ms • no API call
        </span>
      </div>

      <div className="mt-2 border-slate-700 pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-400">
            Region-Approved Alternatives (India / CDSCO)
          </h4>
        </div>
        <div className="space-y-2">
          {cdscoAlts.map((alt: any, i: number) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Shield className="w-4 h-4 text-emerald-400" />
                   <span className="font-semibold text-sm text-emerald-100">{alt.drug}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {alt.class}
                </span>
              </div>
              <p className="text-xs text-slate-400 ml-6">{alt.notes}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 p-2 bg-slate-900/50 rounded-lg">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Rankings are based on your specific genotype. A drug rated &quot;Toxic&quot; for
          your {Object.keys(patientPhenotypes).join("/")} phenotype may be safe for other patients.
          Always consult your clinician.
        </p>
      </div>
    </div>
  );
}
