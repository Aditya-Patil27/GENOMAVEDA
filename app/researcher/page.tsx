"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle2, FileText, Beaker, Database, ArrowLeft } from "lucide-react";
import SyntheticVcfGenerator from "@/components/SyntheticVcfGenerator";
import CpicEvidenceExplorer from "@/components/CpicEvidenceExplorer";

export default function ResearcherPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"vcf" | "evidence">("vcf");

  return (
    <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <div className="w-8 h-8 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100">GenomaVeda</h1>
                <p className="text-xs text-teal-400 font-medium">RESEARCHER SANDBOX</p>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-2">
              <span className="clinical-badge bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Beaker className="w-3 h-3 mr-1.5" />
                SYNTHETIC DATA ONLY
              </span>
              <span className="clinical-badge bg-slate-800 border border-slate-700 text-slate-300">
                <FileText className="w-3 h-3 mr-1.5" />
                CPIC v1.9
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Navigation & Intro */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patient View
          </button>

          <h2 className="text-3xl font-semibold text-slate-100 mb-2">
            Pharmacogenomics Research Tools
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Advanced utilities for bioinformatics algorithm validation and clinical evidence exploration.
            Generate mathematically accurate synthetic VCF payloads or query the CPIC knowledge base directly.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-700 mb-8">
          <button
            onClick={() => setActiveTab("vcf")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === "vcf"
                ? "border-teal-500 text-teal-400 bg-teal-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Beaker className="w-4 h-4" />
            Synthetic VCF Generator
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === "evidence"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Database className="w-4 h-4" />
            CPIC Evidence Explorer
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "vcf" ? (
            <div className="animate-fade-in">
              <SyntheticVcfGenerator />
            </div>
          ) : (
            <div className="animate-fade-in">
              <CpicEvidenceExplorer />
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>GenomaVeda Research v2.4.0</span>
              <span>•</span>
              <span>RIFT 2026 Hackathon</span>
            </div>
            <span className="text-slate-600">RESEARCH USE ONLY. NOT FOR CLINICAL DIAGNOSIS.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
