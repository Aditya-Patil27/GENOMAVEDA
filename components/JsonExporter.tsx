"use client";

import React, { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { AnalysisResult } from "@/lib/types";
import { formatToMinimalSubmissionJson } from "@/lib/submissionFormatter";

interface JsonExporterProps {
  result: AnalysisResult;
}

export default function JsonExporter({ result }: JsonExporterProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadSubmission = () => {
    // Format to minimal submission JSON
    const minimalJson = formatToMinimalSubmissionJson(result);
    const jsonString = JSON.stringify(minimalJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission_${result.patient_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFull = () => {
    // Full JSON export (current behavior)
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `full_${result.patient_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const jsonString = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleDownloadSubmission}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded transition-colors"
        title="Download minimal submission JSON"
      >
        <Download className="w-3.5 h-3.5" />
        Submission JSON
      </button>
      <button
        onClick={handleDownloadFull}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded transition-colors"
        title="Download full technical JSON"
      >
        <Download className="w-3.5 h-3.5" />
        Full JSON
      </button>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded transition-all ${
          copied
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            : "text-slate-400 hover:text-slate-300 bg-slate-700/50 hover:bg-slate-700 border-slate-600"
        }`}
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
