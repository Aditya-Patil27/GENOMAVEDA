"use client";

import React, { useState } from "react";
import { AlertCircle, ShieldX, X } from "lucide-react";
import { AnalysisResult } from "@/lib/types";

interface ZeroLayerSentryProps {
  results: AnalysisResult[];
}

interface SentryAlert {
  type: "toxic" | "deterioration" | "polypharmacy";
  title: string;
  message: string;
  drug: string;
}

function detectAlerts(results: AnalysisResult[]): SentryAlert[] {
  const alerts: SentryAlert[] = [];

  for (const r of results) {
    // 1. Toxic drug detection
    if (r.risk_assessment.risk_label === "Toxic") {
      alerts.push({
        type: "toxic",
        title: "LAYER 0 SENTRY INTERCEPT",
        message: `Pre-emptive Warning: Genomic record indicates high-risk variant for ${r.drug} (${r.pharmacogenomic_profile.primary_gene} ${r.pharmacogenomic_profile.diplotype} → ${r.pharmacogenomic_profile.phenotype}). Do NOT initiate this medication.`,
        drug: r.drug,
      });
    }

    // 2. Critical severity
    if (r.risk_assessment.severity === "critical") {
      alerts.push({
        type: "toxic",
        title: "CRITICAL SEVERITY DETECTED",
        message: `${r.drug} interaction with ${r.pharmacogenomic_profile.primary_gene} has critical severity. Immediate clinical review required.`,
        drug: r.drug,
      });
    }
  }

  // 3. Polypharmacy risk: multiple high-risk drugs
  const riskyDrugs = results.filter(
    (r) => r.risk_assessment.risk_label === "Toxic" || r.risk_assessment.risk_label === "Adjust Dosage"
  );
  if (riskyDrugs.length >= 2) {
    const drugNames = riskyDrugs.map((r) => r.drug).join(" + ");
    const genes = Array.from(new Set(riskyDrugs.map((r) => r.pharmacogenomic_profile.primary_gene)));
    alerts.push({
      type: "polypharmacy",
      title: "POLYPHARMACY DDGI WARNING",
      message: `Drug-Drug-Gene Interaction detected: ${drugNames} share compromised metabolic pathways via ${genes.join(", ")}. Combined toxicity risk amplified. Review all concurrent medications.`,
      drug: drugNames,
    });
  }

  return alerts;
}

export default function ZeroLayerSentry({ results }: ZeroLayerSentryProps) {
  const alerts = detectAlerts(results);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (alerts.length === 0) return null;

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-slide-up">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null;

        const isPolypharmacy = alert.type === "polypharmacy";
        const borderColor = isPolypharmacy ? "border-amber-500" : "border-crimson-500";
        const bgColor = isPolypharmacy ? "bg-amber-500/5" : "bg-crimson-500/5";
        const iconColor = isPolypharmacy ? "text-amber-500" : "text-crimson-500";
        const textColor = isPolypharmacy ? "text-amber-400" : "text-crimson-400";
        const titleColor = isPolypharmacy ? "text-amber-300" : "text-crimson-300";

        return (
          <div
            key={i}
            className={`relative ${bgColor} border-l-4 ${borderColor} rounded-r p-4 flex items-start gap-3`}
          >
            {/* Pulsing icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isPolypharmacy ? (
                <AlertCircle className={`w-5 h-5 ${iconColor} animate-pulse`} />
              ) : (
                <ShieldX className={`w-5 h-5 ${iconColor} animate-pulse`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-xs font-mono font-bold ${titleColor} uppercase tracking-wider`}>
                {alert.title}
              </h3>
              <p className={`text-sm ${textColor} mt-1 leading-relaxed`}>
                {alert.message}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(i))}
              className="flex-shrink-0 text-muted hover:text-offwhite transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
