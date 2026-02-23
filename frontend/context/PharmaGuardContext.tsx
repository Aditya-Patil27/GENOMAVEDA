"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ParsedVCF } from "@/lib/vcf-parser";
import { Drug, AnalysisResult } from "@/lib/types";
import { PrivacyState, INITIAL_PRIVACY_STATE } from "@/lib/privacy-monitor";

interface PharmaGuardContextType {
  // Existing state
  parsedVCFData: ParsedVCF | null;
  setParsedVCFData: (data: ParsedVCF | null) => void;
  selectedDrug: Drug[];
  setSelectedDrug: (drugs: Drug[]) => void;
  analysisResult: AnalysisResult[];
  setAnalysisResult: (results: AnalysisResult[]) => void;
  detectedGenes: string[];
  setDetectedGenes: (genes: string[]) => void;

  // F1: Privacy state
  privacyState: PrivacyState;
  updatePrivacy: (partial: Partial<PrivacyState>) => void;
  clearAllData: () => void;
}

const PharmaGuardContext = createContext<PharmaGuardContextType | undefined>(undefined);

export function PharmaGuardProvider({ children }: { children: ReactNode }) {
  const [parsedVCFData, _setParsedVCFData] = useState<ParsedVCF | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<Drug[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[]>([]);
  const [detectedGenes, setDetectedGenes] = useState<string[]>([]);
  const [privacyState, setPrivacyState] = useState<PrivacyState>(INITIAL_PRIVACY_STATE);

  // Wrap setParsedVCFData to also update privacy state
  const setParsedVCFData = useCallback((data: ParsedVCF | null) => {
    _setParsedVCFData(data);
    if (data) {
      setPrivacyState((prev) => ({
        ...prev,
        vcf_in_memory: true,
        variants_in_memory: data.variants.length > 0,
        session_start: prev.session_start ?? new Date(),
        data_cleared: false,
      }));
    }
  }, []);

  const updatePrivacy = useCallback((partial: Partial<PrivacyState>) => {
    setPrivacyState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearAllData = useCallback(() => {
    _setParsedVCFData(null);
    setSelectedDrug([]);
    setAnalysisResult([]);
    setDetectedGenes([]);
    setPrivacyState({
      ...INITIAL_PRIVACY_STATE,
      data_cleared: true,
    });
  }, []);

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
        privacyState,
        updatePrivacy,
        clearAllData,
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
