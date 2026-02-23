"use client";

import React, { useMemo } from "react";
import { ArrowRight, Shield, ShieldAlert, ShieldX, ShieldQuestion, Info } from "lucide-react";
import therapeuticClasses from "@/data/therapeutic-classes.json";

interface GeneDep {
  gene: string;
  dependency: string;
}

interface TherapeuticClass {
  drugs: string[];
  primary_gene: string;
  gene_dependencies: Record<string, GeneDep>;
}

interface AlternativeRanking {
  drug: string;
  risk_label: "Safe" | "Adjust Dosage" | "Toxic" | "Unknown";
  gene_dependency: string;
  dependency_type: string;
  note: string;
}

const dependencyLabels: Record<string, string> = {
  required_for_activation: "Required for activation — high PGx risk",
  partial_activation: "Partial activation dependency",
  minor_metabolism: "Minor metabolic pathway",
  primary_metabolism: "Primary metabolism pathway",
  none: "No PGx dependency — safe regardless of genotype",
  transporter: "Transporter-mediated uptake",
  minor_transporter: "Minor transporter involvement",
  minimal: "Minimal PGx impact",
  required_for_clearance: "Required for drug clearance — critical",
};

function resolveRisk(
  dependency: string,
  patientPheno: string
): { label: "Safe" | "Adjust Dosage" | "Toxic" | "Unknown"; note: string } {
  if (dependency === "none" || dependency === "minimal") {
    return { label: "Safe", note: "No pharmacogenomic dependency for this enzyme" };
  }

  if (patientPheno === "PM") {
    if (dependency === "required_for_activation" || dependency === "required_for_clearance") {
      return { label: "Toxic", note: `Poor Metabolizer — ${dependency.replace(/_/g, " ")} compromised` };
    }
    return { label: "Adjust Dosage", note: `Poor Metabolizer — ${dependency.replace(/_/g, " ")}` };
  }

  if (patientPheno === "IM") {
    if (dependency === "required_for_activation" || dependency === "required_for_clearance") {
      return { label: "Adjust Dosage", note: "Intermediate Metabolizer — reduced enzyme activity" };
    }
    return { label: "Safe", note: "Intermediate Metabolizer — minor impact on this pathway" };
  }

  if (patientPheno === "RM" || patientPheno === "URM") {
    if (dependency === "required_for_activation") {
      return { label: "Adjust Dosage", note: "Rapid Metabolizer — may need dose adjustment" };
    }
    return { label: "Safe", note: "Rapid/Ultra-rapid metabolism — standard dosing" };
  }

  if (patientPheno === "NM") {
    return { label: "Safe", note: "Normal Metabolizer — standard response expected" };
  }

  return { label: "Unknown", note: "Phenotype data not available for this gene" };
}

const riskColors = {
  Safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: Shield },
  "Adjust Dosage": { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: ShieldAlert },
  Toxic: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: ShieldX },
  Unknown: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", icon: ShieldQuestion },
};

interface DrugAlternativeSimulatorProps {
  currentDrug: string;
  currentRiskLabel: string;
  patientPhenotypes: Record<string, string>; // e.g. { CYP2D6: "PM", CYP2C19: "NM" }
}

export default function DrugAlternativeSimulator({
  currentDrug,
  currentRiskLabel,
  patientPhenotypes,
}: DrugAlternativeSimulatorProps) {
  const alternatives = useMemo(() => {
    const classes = therapeuticClasses as Record<string, TherapeuticClass>;
    const tc = Object.values(classes).find((c) =>
      Object.keys(c.gene_dependencies).includes(currentDrug)
    );
    if (!tc) return [];

    return Object.entries(tc.gene_dependencies)
      .filter(([drug]) => drug !== currentDrug)
      .map(([drug, dep]) => {
        const patientPheno = patientPhenotypes[dep.gene] ?? "Unknown";
        const risk = resolveRisk(dep.dependency, patientPheno);
        return {
          drug,
          risk_label: risk.label,
          gene_dependency: dep.gene,
          dependency_type: dep.dependency,
          note: risk.note,
        } as AlternativeRanking;
      })
      .sort((a, b) => {
        const order = { Safe: 0, "Adjust Dosage": 1, Unknown: 2, Toxic: 3 };
        return order[a.risk_label] - order[b.risk_label];
      });
  }, [currentDrug, patientPhenotypes]);

  // Only show for Toxic or Adjust Dosage results
  if (currentRiskLabel !== "Toxic" && currentRiskLabel !== "Adjust Dosage") {
    return null;
  }

  if (alternatives.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="w-4 h-4 text-teal-400" />
        <h4 className="text-sm font-semibold text-teal-400">
          Find a Safer Alternative
        </h4>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          client-side • &lt;100ms • no API call
        </span>
      </div>

      <div className="space-y-2">
        {alternatives.map((alt) => {
          const config = riskColors[alt.risk_label];
          const Icon = config.icon;
          return (
            <div
              key={alt.drug}
              className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg} ${config.border} transition-all`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${config.text}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">
                    {alt.drug}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                    {alt.risk_label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{alt.note}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-500 font-mono">{alt.gene_dependency}</p>
                <p className="text-xs text-slate-600">
                  {dependencyLabels[alt.dependency_type] ?? alt.dependency_type}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 p-2 bg-slate-900/50 rounded-lg">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Rankings are based on your specific genotype. A drug rated &quot;Toxic&quot; for
          your {Object.keys(patientPhenotypes).join("/")} phenotype may be safe for other patients.
          Always consult your clinician.
        </p>
      </div>
    </div>
  );
}
