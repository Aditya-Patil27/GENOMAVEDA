"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import {
  GitBranch,
  FileText,
  Calculator,
  Terminal,
  ChevronRight,
} from "lucide-react";

interface GlassBoxPanelProps {
  result: AnalysisResult;
}

/** Reconstruct the LLM prompt that was sent for transparency */
function reconstructPrompt(result: AnalysisResult): string {
  const ctx = result.data_source;
  return `SYSTEM: You are a pharmacogenomics clinical decision support AI.
CONTEXT: Analyze the following drug-gene interaction using live CPIC guidelines.

PATIENT PROFILE:
  Drug: ${result.drug}
  Gene: ${result.pharmacogenomic_profile.primary_gene}
  Diplotype: ${result.pharmacogenomic_profile.diplotype}
  Phenotype: ${result.pharmacogenomic_profile.phenotype}
  Risk Label: ${result.risk_assessment.risk_label}
  Confidence: ${(result.risk_assessment.confidence_score * 100).toFixed(0)}%

CPIC GUIDELINE CONTEXT:
  Classification: ${ctx?.cpic_classification || "N/A"}
  Implications: ${ctx?.cpic_implications || "N/A"}

INSTRUCTIONS:
  Provide a JSON response with: summary, biological_mechanism,
  variant_impact, clinical_context, and disclaimer fields.
  Ground every claim in the CPIC guideline above.`;
}

export default function GlassBoxPanel({ result }: GlassBoxPanelProps) {
  const profile = result.pharmacogenomic_profile;
  const risk = result.risk_assessment;
  const ds = result.data_source;
  const prompt = reconstructPrompt(result);

  const decisionSteps = [
    {
      step: "1. Gene Identified",
      detail: `VCF → ${profile.primary_gene} (${profile.detected_variants.length} variant${profile.detected_variants.length !== 1 ? "s" : ""} detected)`,
      status: "done",
    },
    {
      step: "2. Diplotype Resolved",
      detail: `Star alleles → ${profile.diplotype} ${ds?.diplotype_exact_match ? "(exact CPIC match ✓)" : "(inferred match)"}`,
      status: "done",
    },
    {
      step: "3. Phenotype Mapped",
      detail: `Diplotype → ${profile.phenotype} metabolizer status via CPIC lookup`,
      status: "done",
    },
    {
      step: "4. Risk Classified",
      detail: `Phenotype + Drug → "${risk.risk_label}" (severity: ${risk.severity})`,
      status: risk.risk_label === "Unknown" ? "warn" : "done",
    },
    {
      step: "5. Confidence Scored",
      detail: ds?.confidence_basis || `Score: ${(risk.confidence_score * 100).toFixed(0)}%`,
      status: "done",
    },
    {
      step: "6. LLM Explanation",
      detail: "Prompt grounded in CPIC guideline context → structured clinical summary",
      status: "done",
    },
  ];

  return (
    <div className="mt-4 rounded border border-teal-400/20 bg-base-900/80 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-400/5 border-b border-teal-400/15">
        <Terminal className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
          Glass Box — Audit Trail
        </span>
        <span className="ml-auto text-xs text-muted font-mono">
          {result.timestamp}
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* 1. Decision Tree */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
              Deterministic Logic Tree
            </h4>
          </div>
          <div className="space-y-1.5 pl-1">
            {decisionSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 group">
                <ChevronRight className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                  s.status === "warn" ? "text-amber-500" : "text-jade-500"
                }`} />
                <div className="min-w-0">
                  <span className="text-xs font-mono font-semibold text-offwhite/90">
                    {s.step}
                  </span>
                  <p className="text-xs font-mono text-muted leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. CPIC Evidence Row */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
              CPIC Guideline Evidence
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-base-800/80 rounded p-2.5 border border-offwhite/5">
              <p className="text-[10px] font-mono text-muted uppercase mb-1">Classification</p>
              <p className="text-xs font-mono text-teal-400 font-semibold">
                {ds?.cpic_classification || "N/A"}
              </p>
            </div>
            <div className="bg-base-800/80 rounded p-2.5 border border-offwhite/5">
              <p className="text-[10px] font-mono text-muted uppercase mb-1">Diplotype Match</p>
              <p className={`text-xs font-mono font-semibold ${ds?.diplotype_exact_match ? "text-jade-500" : "text-amber-500"}`}>
                {ds?.diplotype_exact_match ? "Exact Match ✓" : "Inferred ⚠"}
              </p>
            </div>
            <div className="bg-base-800/80 rounded p-2.5 border border-offwhite/5">
              <p className="text-[10px] font-mono text-muted uppercase mb-1">Data Source</p>
              <p className="text-xs font-mono text-teal-400 font-semibold">
                {ds?.cpic_api ? "Live CPIC API" : "Fallback Cache"}
              </p>
            </div>
          </div>
          {ds?.cpic_implications && (
            <div className="mt-2 bg-base-800/80 rounded p-2.5 border border-offwhite/5">
              <p className="text-[10px] font-mono text-muted uppercase mb-1">Clinical Implications</p>
              <p className="text-xs font-mono text-offwhite/80 leading-relaxed">
                {ds.cpic_implications}
              </p>
            </div>
          )}
        </section>

        {/* 3. Confidence Formula */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
              Confidence Score Breakdown
            </h4>
          </div>
          <div className="bg-base-800/80 rounded p-3 border border-offwhite/5">
            <p className="text-xs font-mono text-offwhite/80 leading-relaxed whitespace-pre-wrap">
              {ds?.confidence_basis || `Final score: ${(risk.confidence_score * 100).toFixed(0)}%`}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-base-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-jade-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(risk.confidence_score * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-teal-400 font-bold">
                {(risk.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </section>

        {/* 4. Raw LLM Prompt */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
              LLM Prompt (Reconstructed)
            </h4>
          </div>
          <div className="bg-base-900 rounded p-3 border border-offwhite/5 max-h-48 overflow-y-auto">
            <pre className="text-[11px] font-mono text-jade-500/80 leading-relaxed whitespace-pre-wrap">
              {prompt}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
