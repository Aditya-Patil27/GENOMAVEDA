"use client";

import React from "react";
import { Drug, DRUG_GENE_MAP, ALL_DRUGS } from "@/lib/types";

interface DrugSelectorProps {
  selectedDrugs: Drug[];
  onSelectionChange: (drugs: Drug[]) => void;
  detectedGenes: string[];
}

const drugDescriptions: Record<Drug, string> = {
  CODEINE: "Opioid Analgesic",
  WARFARIN: "Anticoagulant",
  CLOPIDOGREL: "Antiplatelet",
  SIMVASTATIN: "Statin",
  AZATHIOPRINE: "Immunosuppressant",
  FLUOROURACIL: "Chemotherapy",
};

export default function DrugSelector({
  selectedDrugs,
  onSelectionChange,
  detectedGenes,
}: DrugSelectorProps) {
  const toggleDrug = (drug: Drug) => {
    const gene = DRUG_GENE_MAP[drug];
    if (detectedGenes.length > 0 && !detectedGenes.includes(gene)) return;

    if (selectedDrugs.includes(drug)) {
      onSelectionChange(selectedDrugs.filter((d) => d !== drug));
    } else {
      onSelectionChange([...selectedDrugs, drug]);
    }
  };

  return (
    <div className="w-full animate-slide-up stagger-3">
      <h3 className="text-offwhite font-heading font-semibold text-lg mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
        Select Drugs for Analysis
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                relative p-4 rounded text-left transition-all duration-200
                ${
                  isSelected
                    ? "glass border-teal-400 border bg-teal-400/10 border-glow-teal"
                    : isDisabled
                    ? "glass opacity-40 cursor-not-allowed border-transparent"
                    : "glass border-transparent hover:border-teal-400/30 cursor-pointer"
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              )}
              <p className={`font-heading font-semibold text-sm ${isSelected ? "text-teal-400" : "text-offwhite"}`}>
                {drug}
              </p>
              <p className="font-mono text-xs text-muted mt-1">{gene}</p>
              <p className="text-xs text-muted/70 mt-0.5">{drugDescriptions[drug]}</p>
            </button>
          );
        })}
      </div>
      {selectedDrugs.length > 0 && (
        <p className="text-teal-400/80 text-xs mt-3">
          {selectedDrugs.length} drug{selectedDrugs.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
