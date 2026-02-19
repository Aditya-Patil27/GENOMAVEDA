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
  Download,
} from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import JsonExporter from "./JsonExporter";
import FhirExporter from "./FhirExporter";
import PdfReport from "./PdfReport";
import GlassBoxPanel from "./GlassBoxPanel";

interface RiskDashboardProps {
  results: AnalysisResult[];
}

const riskConfig = {
  Safe: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: Shield,
    label: "SAFE",
  },
  "Adjust Dosage": {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: ShieldAlert,
    label: "ADJUST DOSAGE",
  },
  Toxic: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: ShieldX,
    label: "TOXIC",
  },
  Ineffective: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    icon: ShieldOff,
    label: "INEFFECTIVE",
  },
  Unknown: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-600",
    icon: ShieldQuestion,
    label: "UNKNOWN",
  },
};

const severityColors: Record<string, string> = {
  none: "text-emerald-400",
  low: "text-amber-400",
  moderate: "text-amber-500",
  high: "text-red-400",
  critical: "text-red-500",
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
    <div className="border-t border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-slate-700/30 transition-colors rounded"
      >
        <Icon className="w-4 h-4 text-teal-400 flex-shrink-0" />
        <span className="text-slate-200 text-sm font-medium flex-1">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
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
      className="clinical-card p-6 animate-cascade"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header: Drug name + Risk badge */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">{result.drug}</h3>
          <p className="font-mono text-xs text-slate-400 mt-1">
            {result.pharmacogenomic_profile.primary_gene} • {result.patient_id}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${risk.bg} border ${risk.border}`}>
          <RiskIcon className={`w-5 h-5 ${risk.color}`} />
          <span className={`font-semibold text-sm ${risk.color}`}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Severity + Confidence row */}
      <div className="flex items-center gap-6 mb-5">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Severity</p>
          <p className={`font-semibold text-sm mt-1 ${severityColors[result.risk_assessment.severity]}`}>
            {result.risk_assessment.severity.toUpperCase()}
          </p>
        </div>
        <div className="flex-1">
          <ConfidenceGauge score={result.risk_assessment.confidence_score} />
        </div>
      </div>

      {/* Genomic profile strip */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4 flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-slate-400">Diplotype</p>
          <p className="font-mono text-sm text-teal-400">{result.pharmacogenomic_profile.diplotype}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Phenotype</p>
          <p className="font-mono text-sm text-slate-200">{result.pharmacogenomic_profile.phenotype}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Gene</p>
          <p className="font-mono text-sm text-slate-200">{result.pharmacogenomic_profile.primary_gene}</p>
        </div>
      </div>

      {/* Expandable sections — always visible */}
      <AccordionSection title="Clinical Recommendation" icon={Pill} defaultOpen={true}>
        <div className="space-y-2 text-sm">
          <p className="text-slate-300">{result.clinical_recommendation.primary_recommendation}</p>
          <div className="flex gap-4 flex-wrap mt-2">
            <div>
              <span className="text-slate-400 text-xs">Dose Adjustment:</span>
              <p className="text-slate-300 text-xs">{result.clinical_recommendation.dose_adjustment}</p>
            </div>
            {result.clinical_recommendation.alternative_drugs.length > 0 && (
              <div>
                <span className="text-slate-400 text-xs">Alternatives:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {result.clinical_recommendation.alternative_drugs.map((alt, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-teal-500/10 text-teal-400 rounded border border-teal-500/30">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {result.clinical_recommendation.monitoring_required && (
            <p className="flex items-center gap-1 text-amber-400 text-xs mt-2">
              <AlertTriangle className="w-3 h-3" /> Monitoring required
            </p>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="AI Clinical Explanation" icon={Brain}>
        <div className="space-y-3 text-sm text-slate-300">
          <p>{result.llm_generated_explanation.summary}</p>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Biological Mechanism</p>
            <p className="text-xs">{result.llm_generated_explanation.biological_mechanism}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Variant Impact</p>
            <p className="text-xs">{result.llm_generated_explanation.variant_impact}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Clinical Context</p>
            <p className="text-xs">{result.llm_generated_explanation.clinical_context}</p>
          </div>
          <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2">
            {result.llm_generated_explanation.disclaimer}
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Detected Variants" icon={Dna}>
        {result.pharmacogenomic_profile.detected_variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
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
                  <tr key={i} className="border-b border-slate-700/50 font-mono">
                    <td className="py-1.5 px-2 text-teal-400">{v.rsid}</td>
                    <td className="py-1.5 px-2 text-slate-300">{v.gene}</td>
                    <td className="py-1.5 px-2 text-slate-400">{v.chromosome}</td>
                    <td className="py-1.5 px-2 text-slate-400">{v.position.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-slate-300">{v.star_allele}</td>
                    <td className="py-1.5 px-2 text-slate-400">{v.zygosity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-xs">No variants to display for this drug-gene combination.</p>
        )}
      </AccordionSection>

      <AccordionSection title="Quality Metrics" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Parsing Status</p>
            <p className={result.quality_metrics.vcf_parsing_success ? "text-emerald-400" : "text-red-400"}>
              {result.quality_metrics.vcf_parsing_success ? "✓ Success" : "✗ Failed"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Variants Detected</p>
            <p className="text-slate-300">{result.quality_metrics.variants_detected}</p>
          </div>
          <div>
            <p className="text-slate-400">Genes Analyzed</p>
            <p className="font-mono text-slate-300">
              {result.quality_metrics.genes_analyzed.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Completeness</p>
            <p className="text-slate-300">
              {(result.quality_metrics.annotation_completeness * 100).toFixed(0)}%
            </p>
          </div>
          {result.quality_metrics.parse_warnings.length > 0 && (
            <div className="col-span-2">
              <p className="text-slate-400 mb-1">Warnings</p>
              {result.quality_metrics.parse_warnings.map((w, i) => (
                <p key={i} className="text-amber-400">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Glass Box Audit Trail */}
      <GlassBoxPanel result={result} />

      {/* Export */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-2 flex-wrap">
        <JsonExporter result={result} />
        <FhirExporter result={result} />
        <PdfReport result={result} />
      </div>
    </div>
  );
}

export default function RiskDashboard({ results }: RiskDashboardProps) {
  if (results.length === 0) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-3">
          <Shield className="w-5 h-5 text-teal-400" />
          Analysis Complete
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
          <Download className="w-4 h-4" />
          Export All Reports
        </button>
      </div>
      <div className="space-y-4">
        {results.map((result, index) => (
          <DrugCard key={`${result.drug}-${index}`} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}
