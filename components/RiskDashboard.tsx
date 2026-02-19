"use client";

import React, { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import {
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  ShieldQuestion,
  ChevronDown,
  ChevronRight,
  Dna,
  Pill,
  Brain,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import JsonExporter from "./JsonExporter";

interface RiskDashboardProps {
  results: AnalysisResult[];
}

const riskConfig = {
  Safe: {
    color: "text-white",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: Shield,
    label: "SAFE",
  },
  "Adjust Dosage": {
    color: "text-white",
    bg: "bg-amber-500",
    bgLight: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: ShieldAlert,
    label: "ADJUST DOSAGE",
  },
  Toxic: {
    color: "text-white",
    bg: "bg-red-500",
    bgLight: "bg-red-500/10",
    border: "border-red-500/30",
    icon: ShieldX,
    label: "TOXIC",
  },
  Ineffective: {
    color: "text-white",
    bg: "bg-red-500",
    bgLight: "bg-red-500/10",
    border: "border-red-500/30",
    icon: ShieldOff,
    label: "INEFFECTIVE",
  },
  Unknown: {
    color: "text-white",
    bg: "bg-slate-500",
    bgLight: "bg-slate-500/10",
    border: "border-slate-500/30",
    icon: ShieldQuestion,
    label: "UNKNOWN",
  },
};

export default function RiskDashboard({ results }: RiskDashboardProps) {
  const [expandedExplanation, setExpandedExplanation] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState(false);

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No analysis results available.
      </div>
    );
  }

  const result = results[0];
  const config = riskConfig[result.risk_assessment.risk_label];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* STEP 1: Clinical Decision Summary */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between gap-6">
          {/* LEFT SIDE */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {result.drug}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {result.pharmacogenomic_profile.primary_gene}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-400">Diplotype:</span>
                <span className="text-sm font-bold text-slate-200">
                  {result.pharmacogenomic_profile.diplotype}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-400">Phenotype:</span>
                <span className="text-sm font-semibold text-teal-400">
                  {result.pharmacogenomic_profile.phenotype}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-end gap-3">
            <div
              className={`${config.bg} ${config.color} px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg`}
            >
              <Icon className="w-8 h-8" />
              <span className="text-lg font-bold">{config.label}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Severity
              </p>
              <p className="text-sm font-semibold text-slate-200 capitalize">
                {result.risk_assessment.severity}
              </p>
            </div>
            <ConfidenceGauge score={result.risk_assessment.confidence_score} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50" />

      {/* STEP 2: Clinical Recommendation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-400" />
          Clinical Recommendation
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              {result.clinical_recommendation.primary_recommendation}
            </p>
            {result.clinical_recommendation.dose_adjustment && (
              <p className="text-sm text-slate-300 mt-2">
                {result.clinical_recommendation.dose_adjustment}
              </p>
            )}
          </div>

          {result.clinical_recommendation.alternative_drugs.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                Alternative Medications
              </p>
              <div className="flex flex-wrap gap-2">
                {result.clinical_recommendation.alternative_drugs.map(
                  (drug, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-700/50 border border-slate-600 rounded"
                    >
                      {drug}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {result.clinical_recommendation.monitoring_required && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200">
                Enhanced monitoring required
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              CPIC Guideline: {result.clinical_recommendation.cpic_guideline_version}
            </span>
            <span className="capitalize">
              Strength: {result.clinical_recommendation.recommendation_strength}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50" />

      {/* STEP 3: AI Clinical Explanation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
        <button
          onClick={() => setExpandedExplanation(!expandedExplanation)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-teal-400" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-100">
                AI Clinical Explanation
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Generated using phenotype-based interpretation
              </p>
            </div>
          </div>
          {expandedExplanation ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedExplanation && (
          <div className="px-6 pb-6 space-y-4 border-t border-slate-700/50">
            <div className="pt-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {result.llm_generated_explanation.summary}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">
                Biological Mechanism
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {result.llm_generated_explanation.biological_mechanism}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">
                Variant Impact
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {result.llm_generated_explanation.variant_impact}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">
                Clinical Context
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {result.llm_generated_explanation.clinical_context}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 italic">
                {result.llm_generated_explanation.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50" />

      {/* STEP 4: Supporting Genomic Evidence */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
        <button
          onClick={() => setExpandedEvidence(!expandedEvidence)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Dna className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-100">
              Supporting Genomic Evidence
            </h3>
          </div>
          {expandedEvidence ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedEvidence && (
          <div className="px-6 pb-6 space-y-6 border-t border-slate-700/50">
            {/* Detected Variants */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Detected Variants
              </h4>
              <div className="space-y-3">
                {result.pharmacogenomic_profile.detected_variants.map(
                  (variant, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-700/30 border border-slate-600 rounded"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-mono font-semibold text-teal-400">
                            {variant.rsid}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            {variant.gene}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-slate-600/50 text-slate-300 rounded font-mono">
                          {variant.star_allele}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-slate-500">Position:</span>
                          <span className="text-slate-300 ml-2 font-mono">
                            chr{variant.chromosome}:{variant.position}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Zygosity:</span>
                          <span className="text-slate-300 ml-2 capitalize">
                            {variant.zygosity}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Alleles:</span>
                          <span className="text-slate-300 ml-2 font-mono">
                            {variant.ref_allele} → {variant.alt_allele}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Significance:</span>
                          <span className="text-slate-300 ml-2">
                            {variant.clinical_significance}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="pt-4 border-t border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">
                Quality Metrics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                  <p className="text-xs text-slate-400 mb-1">VCF Parsing</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {result.quality_metrics.vcf_parsing_success
                      ? "Success"
                      : "Failed"}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                  <p className="text-xs text-slate-400 mb-1">
                    Variants Detected
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {result.quality_metrics.variants_detected}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                  <p className="text-xs text-slate-400 mb-1">Genes Analyzed</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {result.quality_metrics.genes_analyzed.join(", ")}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                  <p className="text-xs text-slate-400 mb-1">
                    Annotation Completeness
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {Math.round(
                      result.quality_metrics.annotation_completeness * 100
                    )}
                    %
                  </p>
                </div>
              </div>

              {result.quality_metrics.parse_warnings.length > 0 && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
                  <p className="text-xs font-semibold text-amber-400 mb-2">
                    Parse Warnings
                  </p>
                  <ul className="text-xs text-amber-200 space-y-1">
                    {result.quality_metrics.parse_warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500">
          Patient ID: {result.patient_id} • Generated: {new Date(result.timestamp).toLocaleString()}
        </div>
        <JsonExporter result={result} />
      </div>
    </div>
  );
}
