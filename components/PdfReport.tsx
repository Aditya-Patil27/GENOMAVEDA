"use client";

import React, { useState } from "react";
import { FileDown, Loader2, Check } from "lucide-react";
import { AnalysisResult } from "@/lib/types";

interface PdfReportProps {
  result: AnalysisResult;
}

/**
 * Generate a styled HTML string for the clinical report,
 * then use the browser print-to-PDF flow (window.print).
 */
function buildReportHTML(result: AnalysisResult): string {
  const profile = result.pharmacogenomic_profile;
  const risk = result.risk_assessment;
  const rec = result.clinical_recommendation;
  const expl = result.llm_generated_explanation;
  const ds = result.data_source;

  const riskColor =
    risk.risk_label === "Toxic"
      ? "#FF2D55"
      : risk.risk_label === "Adjust Dosage"
      ? "#FFB800"
      : risk.risk_label === "Safe"
      ? "#00C896"
      : "#8B95A8";

  const variantsHTML = profile.detected_variants.length > 0
    ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">
        <tr style="background:#f5f5f5;"><th style="padding:6px;text-align:left;border:1px solid #ddd;">rsID</th><th style="padding:6px;text-align:left;border:1px solid #ddd;">Gene</th><th style="padding:6px;text-align:left;border:1px solid #ddd;">Star Allele</th><th style="padding:6px;text-align:left;border:1px solid #ddd;">Zygosity</th><th style="padding:6px;text-align:left;border:1px solid #ddd;">Chr:Position</th></tr>
        ${profile.detected_variants.map(v => `
          <tr><td style="padding:5px;border:1px solid #ddd;font-family:monospace;">${v.rsid}</td><td style="padding:5px;border:1px solid #ddd;">${v.gene}</td><td style="padding:5px;border:1px solid #ddd;font-family:monospace;">${v.star_allele}</td><td style="padding:5px;border:1px solid #ddd;">${v.zygosity}</td><td style="padding:5px;border:1px solid #ddd;font-family:monospace;">chr${v.chromosome}:${v.position}</td></tr>
        `).join("")}
       </table>`
    : "<p style='color:#999;font-size:11px;'>No variants detected for this gene.</p>";

  return `
<!DOCTYPE html>
<html>
<head>
  <title>PharmaGuard Clinical Report — ${result.drug}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
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
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>⚕ PharmaGuard Clinical Report</h1>
      <p style="font-size:12px;color:#666;margin-top:4px;">Pharmacogenomic Risk Assessment — Generated ${new Date().toLocaleDateString()}</p>
    </div>
    <div>
      <span class="badge" style="background:#00E5CC20;color:#00A87D;">Patient: ${result.patient_id}</span>
    </div>
  </div>

  <div class="risk-banner" style="background:${riskColor}15;border:2px solid ${riskColor};">
    <p style="font-size:20px;font-weight:700;color:${riskColor};">${risk.risk_label.toUpperCase()}</p>
    <p style="font-size:12px;color:#555;margin-top:4px;">
      Drug: <strong>${result.drug}</strong> | Severity: <strong>${risk.severity.toUpperCase()}</strong> | Confidence: <strong>${(risk.confidence_score * 100).toFixed(0)}%</strong>
    </p>
  </div>

  <div class="section">
    <h2>Pharmacogenomic Profile</h2>
    <div class="grid">
      <div class="grid-item"><label>Gene</label><div class="value">${profile.primary_gene}</div></div>
      <div class="grid-item"><label>Diplotype</label><div class="value">${profile.diplotype}</div></div>
      <div class="grid-item"><label>Phenotype</label><div class="value">${profile.phenotype}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Detected Variants</h2>
    ${variantsHTML}
  </div>

  <div class="section">
    <h2>Clinical Recommendation</h2>
    <p><strong>${rec.primary_recommendation}</strong></p>
    <p style="margin-top:6px;font-size:12px;"><strong>Dose Adjustment:</strong> ${rec.dose_adjustment}</p>
    ${rec.alternative_drugs.length > 0 ? `<p style="margin-top:4px;font-size:12px;"><strong>Alternatives:</strong> ${rec.alternative_drugs.join(", ")}</p>` : ""}
    <p style="margin-top:4px;font-size:11px;color:#888;">CPIC Guideline: ${rec.cpic_guideline_version} | Strength: ${rec.recommendation_strength}</p>
  </div>

  <div class="section">
    <h2>AI Clinical Explanation</h2>
    <p>${expl.summary}</p>
    <p style="margin-top:8px;font-size:12px;"><strong>Biological Mechanism:</strong> ${expl.biological_mechanism}</p>
    <p style="margin-top:6px;font-size:12px;"><strong>Clinical Context:</strong> ${expl.clinical_context}</p>
  </div>

  <div class="section">
    <h2>Evidence Source</h2>
    <div class="grid">
      <div class="grid-item"><label>Data Source</label><div class="value" style="font-size:11px;">${ds?.cpic_api ? "Live CPIC API" : "Cached"}</div></div>
      <div class="grid-item"><label>Classification</label><div class="value" style="font-size:11px;">${ds?.cpic_classification || "N/A"}</div></div>
      <div class="grid-item"><label>Diplotype Match</label><div class="value" style="font-size:11px;">${ds?.diplotype_exact_match ? "Exact ✓" : "Inferred"}</div></div>
    </div>
  </div>

  <div class="footer">
    <p><strong>PharmaGuard</strong> — RIFT 2026 Hackathon | Team Antigravity | Pharmacogenomics / Explainable AI Track</p>
    <p style="margin-top:4px;">This report is AI-generated clinical decision support using live CPIC guideline data. All treatment decisions require qualified healthcare provider review.</p>
    <p style="margin-top:4px;">Generated: ${new Date().toISOString()} | ${expl.disclaimer}</p>
  </div>
</body>
</html>`;
}

export default function PdfReport({ result }: PdfReportProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);

    const html = buildReportHTML(result);

    // Open in new window with print dialog (saves as PDF)
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      // Trigger print dialog after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 300);
      };

      // Fallback: trigger print immediately for fast loads
      setTimeout(() => {
        try { printWindow.print(); } catch { /* already printing */ }
      }, 800);
    }

    setGenerating(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded transition-all ${
        done
          ? "text-jade-500 bg-jade-500/10 border-jade-500/20"
          : "text-teal-400 bg-teal-400/10 hover:bg-teal-400/20 border-teal-400/20"
      }`}
      title="Generate printable clinical PDF report"
    >
      {generating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : done ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      {done ? "Report Ready!" : "Clinical PDF"}
    </button>
  );
}
