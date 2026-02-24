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
  Eye,
  EyeOff,
  Volume2,
  Square,
  Globe2
} from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import JsonExporter from "./JsonExporter";
import FhirExporter from "./FhirExporter";
import PdfReport from "./PdfReport";
import GlassBoxPanel from "./GlassBoxPanel";
import InteractionFingerprint from "./InteractionFingerprint";

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
  const [showPhi, setShowPhi] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lang, setLang] = useState("en-US");
  
  const risk = riskConfig[result.risk_assessment.risk_label] || riskConfig.Unknown;
  const RiskIcon = risk.icon;

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      let textToSpeak = "";
      if (typeof result.risk_assessment.llm_generated_explanation === "string") {
         textToSpeak = result.risk_assessment.llm_generated_explanation;
      } else {
         // Fallback if structured
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         textToSpeak = (result.risk_assessment.llm_generated_explanation as any)?.summary || "No explanation available.";
      }
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang;
      
      // Basic language voice mapping if available
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes(lang.split('-')[0]));
      if (voice) utterance.voice = voice;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

      {/* Evidence UI Block (User Fix) */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-slate-700 p-4 rounded bg-slate-800">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase">Classification</p>
          <p className={result.data_source?.diplotype_exact_match ? "text-teal-400 font-bold" : "text-yellow-400 font-bold"}>
            {result.data_source?.diplotype_exact_match ? "CPIC v1.9" : "N/A"}
          </p>
        </div>
        
        <div className="border border-slate-700 p-4 rounded bg-slate-800">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase">Diplotype Match</p>
          <p className={result.risk_assessment.confidence_score >= 0.99 ? "text-teal-400 font-bold" : "text-yellow-400 font-bold flex items-center gap-2"}>
            {result.risk_assessment.confidence_score >= 0.99 ? "Exact Match ✓" : "Inferred ⚠"}
          </p>
        </div>
        
        <div className="border border-slate-700 p-4 rounded bg-slate-800">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase">Data Source</p>
          <p className={result.data_source?.confidence_basis?.toLowerCase().includes('offline') ? "text-teal-400 font-bold text-xs" : "text-yellow-400 font-bold text-xs"}>
            {result.data_source?.confidence_basis || "Fallback Cache"} 
          </p>
        </div>
      </div>

      {/* Expandable sections — always visible */}
      <AccordionSection title="Clinical Recommendation" icon={Pill} defaultOpen={true}>
        <div className="space-y-2 text-sm">
          <p className="text-slate-300">{result.risk_assessment.clinical_recommendation}</p>
          <div className="flex gap-4 flex-wrap mt-2">
             <span className="text-slate-400 text-xs italic">See Drug Alternative Simulator for alternative drug suggestions.</span>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="AI Clinical Explanation" icon={Brain}>
        <div className="mb-4 flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-700">
          <Globe2 className="w-4 h-4 text-teal-400" />
          <select 
            className="bg-transparent text-sm text-slate-200 outline-none border-b border-dashed border-slate-600 focus:border-teal-400 pb-0.5 cursor-pointer"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="hi-IN">Hindi (India)</option>
            <option value="ta-IN">Tamil (India)</option>
            <option value="mr-IN">Marathi (India)</option>
            <option value="es-ES">Spanish (Spain)</option>
          </select>
          <div className="flex-1"></div>
          <button 
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              isPlaying ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" : "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/50"
            }`}
          >
            {isPlaying ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {isPlaying ? "STOP AUDIO" : "LISTEN"}
          </button>
        </div>
        
        <div className="space-y-3 text-sm text-slate-300">
          {typeof result.risk_assessment.llm_generated_explanation === "string" ? (
             <p className="whitespace-pre-wrap leading-relaxed">{result.risk_assessment.llm_generated_explanation}</p>
          ) : (
            <>
              <p>{(result.risk_assessment.llm_generated_explanation as any).summary}</p>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Biological Mechanism</p>
                <p className="text-xs">{(result.risk_assessment.llm_generated_explanation as any).biological_mechanism}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Variant Impact</p>
                <p className="text-xs">{(result.risk_assessment.llm_generated_explanation as any).variant_impact}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Clinical Context</p>
                <p className="text-xs">{(result.risk_assessment.llm_generated_explanation as any).clinical_context}</p>
              </div>
              <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2">
                {(result.risk_assessment.llm_generated_explanation as any).disclaimer}
              </p>
            </>
          )}
        </div>
      </AccordionSection>

      <div className="mt-8 border border-slate-700 rounded-xl overflow-hidden bg-base-900 shadow-sm">
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
             <ShieldAlert className="text-amber-400" size={18} />
             <span className="font-bold text-slate-100 text-sm">Protected Health Information (PHI)</span>
          </div>
          <button 
            onClick={() => setShowPhi(!showPhi)}
            className="flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded transition font-bold border border-slate-600"
          >
            {showPhi ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPhi ? "Hide Raw Genomic Data" : "Clinician Override: Reveal"}
          </button>
        </div>
        
        {showPhi ? (
          <div className="p-4 bg-red-500/10 border-l-4 border-red-500/50">
            <p className="text-xs text-red-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={12} /> Warning: Viewing Identifiable Genomic Data (rsID / Position)
            </p>
            
            {/* EXISTING DETECTED VARIANTS TABLE */}
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
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/50">
            <p className="text-slate-500 text-sm font-mono flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-slate-700" />
              Raw chromosomal positions, star alleles, and zygosity are masked by default to ensure Edge-Privacy compliance.
            </p>
          </div>
        )}
      </div>

      <AccordionSection title="Quality Metrics" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Parsing Status</p>
            <p className={result.quality_metrics.vcf_parsing_success ? "text-emerald-400" : "text-red-400"}>
              {result.quality_metrics.vcf_parsing_success ? "✓ Success" : "✗ Failed"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Missing Genes</p>
            <p className="text-slate-300 truncate" title={result.quality_metrics.genes_missing?.join(", ")}>
              {result.quality_metrics.genes_missing?.join(", ") || "None"}
            </p>
          </div>
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

import { buildReportHTML } from "./PdfReport";

// ... (existing imports)

export default function RiskDashboard({ results }: RiskDashboardProps) {
  if (results.length === 0) return null;

  const selectedDrugs = results.map((r) => r.drug);
  const patientPhenotypes = results.reduce((acc, r) => {
    acc[r.pharmacogenomic_profile.primary_gene] = r.pharmacogenomic_profile.phenotype;
    return acc;
  }, {} as Record<string, string>);

  const handleExportAll = () => {
    // Generate combined HTML
    const reportContent = results.map(result => {
        // Extract body content from the full HTML generated by buildReportHTML
        // Implementation detail: buildReportHTML returns a full <html> document.
        // We need to strip the <html>, <head>, <body> tags to concatenate them, 
        // OR we just write a custom wrapper here.
        // Copying buildReportHTML logic is cleaner than parsing strings.
        // Let's rely on a valid assumption: simpler to REUSE the buildReportHTML but we need it to return just the BODY content? 
        // No, buildReportHTML returns a full doc. 
        // Let's just create a quick custom aggregator that wraps them.
        
        // BETTER APPROACH:
        // Use a loop to print them one by one? No.
        // Let's modify buildReportHTML to be more flexible?
        return ""; 
    });
    
    // Scratch that. Let's write a dedicated "Multi-Report" builder here.
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PharmaGuard Comprehensive Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
          .page-break { page-break-after: always; display: block; height: 0; margin: 40px 0; border-bottom: 1px dashed #ddd; }
          @media print { .page-break { border: none; } }
          /* Reusing styles from PdfReport */
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00E5CC; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; color: #0A0F1E; }
          .header .badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
          .risk-banner { padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .section { margin-bottom: 20px; }
          .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .section p { font-size: 13px; line-height: 1.6; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .grid-item { background: #f9f9f9; padding: 10px; border-radius: 6px; }
          .grid-item label { font-size: 10px; text-transform: uppercase; color: #888; display: block; margin-bottom: 2px; }
          .grid-item .value { font-size: 14px; font-weight: 600; font-family: monospace; }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:60px;padding-top:100px;">
            <h1 style="font-size:32px;color:#0A0F1E;margin-bottom:16px;">PharmaGuard Comprehensive Analysis</h1>
            <p style="color:#666;">Generated on ${new Date().toLocaleDateString()}</p>
            <p style="margin-top:20px;font-size:14px;"><strong>Patient ID:</strong> ${results[0]?.patient_id || "Unknown"}</p>
            <p style="margin-top:8px;"><strong>Drugs Analyzed:</strong> ${selectedDrugs.join(", ")}</p>
        </div>
        <div class="page-break"></div>
        ${results.map((result) => {
            const riskColor = result.risk_assessment.risk_label === "Toxic" ? "#FF2D55" : result.risk_assessment.risk_label === "Adjust Dosage" ? "#FFB800" : result.risk_assessment.risk_label === "Safe" ? "#00C896" : "#8B95A8";
            
            // Minimal reproduction of PdfReport content
            return `
            <div class="header">
                <div><h1>⚕ Clinical Report: ${result.drug}</h1></div>
                <div><span class="badge" style="background:${riskColor}20;color:${riskColor};">${result.risk_assessment.risk_label.toUpperCase()}</span></div>
            </div>
            <div class="risk-banner" style="background:${riskColor}15;border:2px solid ${riskColor};">
                <p style="font-size:18px;font-weight:700;color:${riskColor};">${result.risk_assessment.clinical_recommendation}</p>
            </div>
            <div class="section">
                <h2>Clinical Context</h2>
                <div class="grid">
                    <div class="grid-item"><label>Genotype</label><div class="value">${result.pharmacogenomic_profile.diplotype} (${result.pharmacogenomic_profile.phenotype})</div></div>
                    <div class="grid-item"><label>Confidence</label><div class="value">${(result.risk_assessment.confidence_score * 100).toFixed(0)}%</div></div>
                    <div class="grid-item"><label>Severity</label><div class="value">${result.risk_assessment.severity.toUpperCase()}</div></div>
                </div>
            </div>
            <div class="section">
                <h2>AI Explanation</h2>
                <p>${typeof result.risk_assessment.llm_generated_explanation === 'string' ? result.risk_assessment.llm_generated_explanation : (result.risk_assessment.llm_generated_explanation as any).summary}</p>
            </div>
            <div class="page-break"></div>
            `;
        }).join("")}
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.onload = () => { setTimeout(() => printWindow.print(), 500); };
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-3">
          <Shield className="w-5 h-5 text-teal-400" />
          Analysis Complete
        </h2>
        <button 
          onClick={handleExportAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All Reports
        </button>
      </div>

      <InteractionFingerprint selectedDrugs={selectedDrugs} patientPhenotypes={patientPhenotypes} />

      <div className="space-y-4">
        {results.map((result, index) => (
          <DrugCard key={`${result.drug}-${index}`} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}
