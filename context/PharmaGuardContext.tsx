"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ParsedVCF } from "@/lib/vcf-parser";
import { Drug, AnalysisResult } from "@/lib/types";

interface PharmaGuardContextType {
  parsedVCFData: ParsedVCF | null;
  setParsedVCFData: (data: ParsedVCF | null) => void;
  selectedDrug: Drug[];
  setSelectedDrug: (drugs: Drug[]) => void;
  analysisResult: AnalysisResult[];
  setAnalysisResult: (results: AnalysisResult[]) => void;
  detectedGenes: string[];
  setDetectedGenes: (genes: string[]) => void;
}

const PharmaGuardContext = createContext<PharmaGuardContextType | undefined>(undefined);

export function PharmaGuardProvider({ children }: { children: ReactNode }) {
  const [parsedVCFData, setParsedVCFData] = useState<ParsedVCF | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<Drug[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[]>([]);
  const [detectedGenes, setDetectedGenes] = useState<string[]>([]);

  return (
    <PharmaGuardContext.Provider
      value={{
        parsedVCFData,
        setParsedVCFData,
        selectedDrug,
        setSelectedDrug,
        analysisResult,
        setAnalysisResult,
        detectedGenes,
        setDetectedGenes,
      }}
    >
      {children}
    </PharmaGuardContext.Provider>
  );
}

export function usePharmaGuard() {
  const context = useContext(PharmaGuardContext);
  if (context === undefined) {
    throw new Error("usePharmaGuard must be used within a PharmaGuardProvider");
  }
  return context;
}
