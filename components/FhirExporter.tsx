"use client";

import React, { useState } from "react";
import { FileHeart, Check } from "lucide-react";
import { AnalysisResult } from "@/lib/types";
import { buildFhirBundle } from "@/lib/fhir-bundle";

interface FhirExporterProps {
  result: AnalysisResult;
}

export default function FhirExporter({ result }: FhirExporterProps) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const bundle = buildFhirBundle(result);
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard_${result.patient_id}_${result.drug}.fhir.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded transition-all ${
        exported
          ? "text-jade-500 bg-jade-500/10 border-jade-500/20"
          : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20"
      }`}
      title="Export as FHIR R4 DiagnosticReport Bundle"
    >
      {exported ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <FileHeart className="w-3.5 h-3.5" />
      )}
      {exported ? "FHIR Exported!" : "Export to EHR (FHIR)"}
      {!exported && (
        <span className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-500/20 rounded text-amber-400">
          R4
        </span>
      )}
    </button>
  );
}
