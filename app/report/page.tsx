"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import RiskDashboard from "@/components/RiskDashboard";
import ProgressIndicator from "@/components/ProgressIndicator";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { usePharmaGuard } from "@/context/PharmaGuardContext";

export default function ReportPage() {
  const router = useRouter();
  const { analysisResult } = usePharmaGuard();
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Route Guard: Redirect if no results
    if (!analysisResult || analysisResult.length === 0) {
      router.push("/upload");
    }
  }, [analysisResult, router]);

  const handleOverlayComplete = () => {
    setShowOverlay(false);
  };

  if (!analysisResult || analysisResult.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100">PharmaGuard</h1>
                <p className="text-xs text-slate-400">v2.4.0</p>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-2">
              <span className="clinical-badge bg-slate-800 border border-slate-700 text-slate-300">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                CPIC-ALIGNED
              </span>
              <span className="clinical-badge bg-slate-800 border border-slate-700 text-slate-300">
                <Shield className="w-3 h-3 mr-1.5" />
                PRIVACY PRESERVING
              </span>
              <span className="clinical-badge bg-slate-800 border border-slate-700 text-slate-300">
                <FileText className="w-3 h-3 mr-1.5" />
                PROCESSED LOCALLY
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Main Title */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/select-drug")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">
          Pharmacogenomic Risk Assessment Platform
        </h2>
        <p className="text-sm text-slate-400">
          Precision medicine, decoded. Upload multi-gene VCF sequences to predict drug-gene interaction risks using CPIC-aligned clinical guidelines.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16 relative">
        {showOverlay && <ProcessingOverlay onComplete={handleOverlayComplete} />}
        
        <div className="clinical-card p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="step-indicator bg-teal-500/10 text-teal-500 border border-teal-500/30">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Risk Assessment Report</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Report ID: PG-38621
            </span>
          </div>

          <RiskDashboard results={analysisResult} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>PharmaGuard v2.4.0</span>
              <span>•</span>
              <span>RIFT 2026 Hackathon</span>
              <span>•</span>
              <span>Team Antigravity</span>
              <span>•</span>
              <span>Pharmacogenomics / Explainable AI Track</span>
            </div>
            <span className="text-slate-600">FOR EDUCATIONAL PURPOSES ONLY. NOT FOR CLINICAL DIAGNOSIS.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
