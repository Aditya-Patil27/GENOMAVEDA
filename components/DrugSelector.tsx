"use client";

import React, { useState } from "react";
import { DrugInfo } from "@/lib/drug-registry";

interface DrugSelectorProps {
  selectedDrugs: string[];
  onSelectionChange: (drugs: string[]) => void;
  detectedGenes: string[];
  drugList: DrugInfo[];
  isLoadingDrugs: boolean;
}

export default function DrugSelector({
  selectedDrugs,
  onSelectionChange,
  detectedGenes,
  drugList,
  isLoadingDrugs,
}: DrugSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleDrugs = showAll
    ? drugList
    : drugList.filter((d) => d.featured || selectedDrugs.includes(d.nameUpper));

  const toggleDrug = (drugName: string, gene: string) => {
    if (detectedGenes.length > 0 && gene && !detectedGenes.includes(gene)) return;

    if (selectedDrugs.includes(drugName)) {
      onSelectionChange(selectedDrugs.filter((d) => d !== drugName));
    } else {
      onSelectionChange([...selectedDrugs, drugName]);
    }
  };

  const featuredCount = drugList.filter((d) => d.featured).length;
  const totalCount = drugList.length;

  return (
    <div className="w-full animate-slide-up stagger-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-offwhite font-heading font-semibold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
          Select Drugs for Analysis
        </h3>
        <div className="flex items-center gap-3">
          {/* Live CPIC indicator */}
          {totalCount > featuredCount && (
            <span className="flex items-center gap-1.5 text-xs text-teal-400/80 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live CPIC Data · {totalCount} drugs
            </span>
          )}
          {totalCount > featuredCount && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-mono text-muted hover:text-teal-400 transition-colors underline underline-offset-2"
            >
              {showAll ? `Show Featured (${featuredCount})` : `Show All (${totalCount})`}
            </button>
          )}
        </div>
      </div>

      {isLoadingDrugs ? (
        <div className="flex items-center justify-center py-8 text-muted text-sm">
          <span className="animate-spin mr-2">⟳</span>
          Loading CPIC drug registry...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {visibleDrugs.map((drug) => {
            const isSelected = selectedDrugs.includes(drug.nameUpper);
            const isDisabled =
              detectedGenes.length > 0 && drug.gene && !detectedGenes.includes(drug.gene);

            return (
              <button
                key={drug.drugId || drug.nameUpper}
                onClick={() => toggleDrug(drug.nameUpper, drug.gene)}
                disabled={!!isDisabled}
                title={
                  isDisabled
                    ? `${drug.gene} not detected in uploaded VCF`
                    : `Analyze ${drug.name} — ${drug.gene || "gene TBD"}`
                }
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
                {drug.featured && !isSelected && (
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-teal-400/40 uppercase tracking-wider">
                    Featured
                  </div>
                )}
                <p
                  className={`font-heading font-semibold text-sm ${
                    isSelected ? "text-teal-400" : "text-offwhite"
                  }`}
                >
                  {drug.nameUpper}
                </p>
                <p className="font-mono text-xs text-muted mt-1">
                  {drug.gene || "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedDrugs.length > 0 && (
        <p className="text-teal-400/80 text-xs mt-3">
          {selectedDrugs.length} drug{selectedDrugs.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
