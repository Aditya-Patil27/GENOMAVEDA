"use client";

import React from "react";
import { Drug, DRUG_GENE_MAP, ALL_DRUGS } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

interface DrugSelectorProps {
  selectedDrugs: Drug[];
  onSelectionChange: (drugs: Drug[]) => void;
  detectedGenes: string[];
}

const drugDescriptions: Record<Drug, string> = {
  CLOPIDOGREL: "Antiplatelet agent",
  WARFARIN: "Anticoagulant",
  SIMVASTATIN: "Statin for cholesterol",
  CODEINE: "Opioid analgesic",
  CARBAMAZEPINE: "Anticonvulsant",
};

export default function DrugSelector({
  selectedDrugs,
  onSelectionChange,
  detectedGenes,
}: DrugSelectorProps) {
  const toggleDrug = (drug: Drug) => {
    if (selectedDrugs.includes(drug)) {
      onSelectionChange(selectedDrugs.filter((d) => d !== drug));
    } else {
      onSelectionChange([...selectedDrugs, drug]);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_DRUGS.map((drug) => {
          const gene = DRUG_GENE_MAP[drug];
          const isSelected = selectedDrugs.includes(drug);
          const isDisabled = detectedGenes.length > 0 && !detectedGenes.includes(gene);

          return (
            <button
              key={drug}
              onClick={() => toggleDrug(drug)}
              disabled={isDisabled}
              title={isDisabled ? `${gene} not detected in uploaded VCF` : `Analyze ${drug} — ${gene}`}
              className={`
                relative p-4 rounded-lg text-left transition-all border
                ${
                  isSelected
                    ? "bg-slate-700 border-teal-500 ring-1 ring-teal-500/50"
                    : isDisabled
                    ? "bg-slate-800/50 border-slate-700 opacity-40 cursor-not-allowed"
                    : "bg-slate-700 border-slate-600 hover:border-slate-500 cursor-pointer"
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-mono mb-1 ${isSelected ? "text-teal-400" : "text-slate-400"}`}>
                    {gene}
                  </p>
                  <p className={`font-semibold text-sm ${isSelected ? "text-slate-100" : "text-slate-200"}`}>
                    {drug}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{drugDescriptions[drug]}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
