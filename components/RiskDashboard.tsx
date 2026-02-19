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
} from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import JsonExporter from "./JsonExporter";

interface RiskDashboardProps {
  results: AnalysisResult[];
}

const riskConfig = {
  Safe: {
    color: "text-jade-500",
    bg: "bg-jade-500/10",
    border: "border-jade-500/30",
    glow: "border-glow-jade",
    icon: Shield,
    label: "SAFE",
  },
  "Adjust Dosage": {
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "border-glow-amber",
    icon: ShieldAlert,
    label: "ADJUST DOSAGE",
  },
  Toxic: {
    color: "text-crimson-500",
    bg: "bg-crimson-500/10",
    border: "border-crimson-500/30",
    glow: "border-glow-crimson",
    icon: ShieldX,
    label: "TOXIC",
  },
  Ineffective: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    glow: "border-glow-amber",
    icon: ShieldOff,
    label: "INEFFECTIVE",
  },
  Unknown: {
    color: "text-muted",
    bg: "bg-muted/10",
    border: "border-muted/30",
    glow: "",
    icon: ShieldQuestion,
    label: "UNKNOWN",
  },
};

const severityColors: Record<string, string> = {
  none: "text-jade-500",
  low: "text-amber-500",
  moderate: "text-amber-400",
  high: "text-crimson-400",
  critical: "text-crimson-500",
};

function AccordionSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-offwhite/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-offwhite/3 transition-colors"
      >
        <Icon className="w-4 h-4 text-teal-400 flex-shrink-0" />
        <span className="text-offwhite/90 text-sm font-medium flex-1">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted" />
        )}
      </button>
      {isOpen && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}

function DrugCard({ result, index }: { result: AnalysisResult; index: number }) {
  const risk = riskConfig[result.risk_assessment.risk_label] || riskConfig.Unknown;
  const RiskIcon = risk.icon;

  return (
    <div
      className={`glass rounded p-6 animate-cascade border ${risk.border} ${risk.glow}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header: Drug name + Risk badge */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xl font-heading font-bold text-offwhite">{result.drug}</h3>
          <p className="font-mono text-xs text-muted mt-1">
            {result.pharmacogenomic_profile.primary_gene} • {result.patient_id}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded ${risk.bg} risk-pulse`}>
          <RiskIcon className={`w-5 h-5 ${risk.color}`} />
          <span className={`font-heading font-bold text-sm ${risk.color}`}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Severity + Confidence row */}
      <div className="flex items-center gap-6 mb-5">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Severity</p>
          <p className={`font-semibold text-sm mt-1 ${severityColors[result.risk_assessment.severity]}`}>
            {result.risk_assessment.severity.toUpperCase()}
          </p>
        </div>
        <div className="flex-1">
          <ConfidenceGauge score={result.risk_assessment.confidence_score} />
        </div>
      </div>

      {/* Genomic profile strip */}
      <div className="bg-base-800/60 rounded p-3 mb-4 flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted">Diplotype</p>
          <p className="font-mono text-sm text-teal-400">{result.pharmacogenomic_profile.diplotype}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phenotype</p>
          <p className="font-mono text-sm text-offwhite">{result.pharmacogenomic_profile.phenotype}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Gene</p>
          <p className="font-mono text-sm text-offwhite">{result.pharmacogenomic_profile.primary_gene}</p>
        </div>
      </div>

      {/* Expandable sections */}
      <AccordionSection title="Clinical Recommendation" icon={Pill} defaultOpen={true}>
        <div className="space-y-2 text-sm">
          <p className="text-offwhite/90">{result.clinical_recommendation.primary_recommendation}</p>
          <div className="flex gap-4 flex-wrap mt-2">
            <div>
              <span className="text-muted text-xs">Dose Adjustment:</span>
              <p className="text-offwhite/80 text-xs">{result.clinical_recommendation.dose_adjustment}</p>
            </div>
            {result.clinical_recommendation.alternative_drugs.length > 0 && (
              <div>
                <span className="text-muted text-xs">Alternatives:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {result.clinical_recommendation.alternative_drugs.map((alt, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-teal-400/10 text-teal-400 rounded">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {result.clinical_recommendation.monitoring_required && (
            <p className="flex items-center gap-1 text-amber-500 text-xs mt-2">
              <AlertTriangle className="w-3 h-3" /> Monitoring required
            </p>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="AI Clinical Explanation" icon={Brain}>
        <div className="space-y-3 text-sm text-offwhite/80">
          <p>{result.llm_generated_explanation.summary}</p>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Biological Mechanism</p>
            <p className="text-xs">{result.llm_generated_explanation.biological_mechanism}</p>
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Variant Impact</p>
            <p className="text-xs">{result.llm_generated_explanation.variant_impact}</p>
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Clinical Context</p>
            <p className="text-xs">{result.llm_generated_explanation.clinical_context}</p>
          </div>
          <p className="text-xs text-muted italic border-t border-offwhite/5 pt-2">
            {result.llm_generated_explanation.disclaimer}
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Detected Variants" icon={Dna}>
        {result.pharmacogenomic_profile.detected_variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-offwhite/5">
                  <th className="text-left py-2 px-2 font-medium">rsID</th>
                  <th className="text-left py-2 px-2 font-medium">Gene</th>
                  <th className="text-left py-2 px-2 font-medium">Chr</th>
                  <th className="text-left py-2 px-2 font-medium">Position</th>
                  <th className="text-left py-2 px-2 font-medium">Star Allele</th>
                  <th className="text-left py-2 px-2 font-medium">Zygosity</th>
                </tr>
              </thead>
              <tbody>
                {result.pharmacogenomic_profile.detected_variants.map((v, i) => (
                  <tr key={i} className="border-b border-offwhite/3 font-mono">
                    <td className="py-1.5 px-2 text-teal-400">{v.rsid}</td>
                    <td className="py-1.5 px-2 text-offwhite/80">{v.gene}</td>
                    <td className="py-1.5 px-2 text-offwhite/60">{v.chromosome}</td>
                    <td className="py-1.5 px-2 text-offwhite/60">{v.position.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-offwhite/80">{v.star_allele}</td>
                    <td className="py-1.5 px-2 text-offwhite/60">{v.zygosity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-xs">No variants to display for this drug-gene combination.</p>
        )}
      </AccordionSection>

      <AccordionSection title="Quality Metrics" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted">Parsing Status</p>
            <p className={result.quality_metrics.vcf_parsing_success ? "text-jade-500" : "text-crimson-500"}>
              {result.quality_metrics.vcf_parsing_success ? "✓ Success" : "✗ Failed"}
            </p>
          </div>
          <div>
            <p className="text-muted">Variants Detected</p>
            <p className="text-offwhite/80">{result.quality_metrics.variants_detected}</p>
          </div>
          <div>
            <p className="text-muted">Genes Analyzed</p>
            <p className="font-mono text-offwhite/80">
              {result.quality_metrics.genes_analyzed.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-muted">Completeness</p>
            <p className="text-offwhite/80">
              {(result.quality_metrics.annotation_completeness * 100).toFixed(0)}%
            </p>
          </div>
          {result.quality_metrics.parse_warnings.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted mb-1">Warnings</p>
              {result.quality_metrics.parse_warnings.map((w, i) => (
                <p key={i} className="text-amber-500">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Export */}
      <div className="mt-4 pt-3 border-t border-offwhite/5">
        <JsonExporter result={result} />
      </div>
    </div>
  );
}

export default function RiskDashboard({ results }: RiskDashboardProps) {
  if (results.length === 0) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <h2 className="text-2xl font-heading font-bold text-offwhite flex items-center gap-3">
        <Shield className="w-6 h-6 text-teal-400" />
        Risk Analysis Results
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((result, index) => (
          <DrugCard key={`${result.drug}-${index}`} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}
