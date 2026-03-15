"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, CheckCircle2, FileText, Beaker, Database, ArrowLeft, Search, Map, Activity } from "lucide-react";
import SyntheticVcfGenerator from "@/components/SyntheticVcfGenerator";
import CpicEvidenceExplorer from "@/components/CpicEvidenceExplorer";
import VusDiscovery from "@/components/VusDiscovery";
import PopulationHeatmap from "@/components/PopulationHeatmap";
import RweFeedbackLoop from "@/components/RweFeedbackLoop";
import { useTranslation } from "@/hooks/useTranslation";

type TabKey = "vcf" | "evidence" | "vus" | "heatmap" | "rwe";

export default function ResearcherPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("vcf");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/")}>
              <Image
                src="/assets/image/logo.png"
                alt="GenomaVeda Logo"
                width={60}
                height={60}
                className="object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-wide" style={{ fontFamily: "Syne, sans-serif" }}>
                  {t("landing.brand")}
                </h1>
                <p className="text-[10px] tracking-wider text-teal-400 font-medium uppercase mt-0.5">
                  {t("researcher.badge_sandbox")}
                </p>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-2">
              <span className="clinical-badge bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Beaker className="w-3 h-3 mr-1.5" />
                {t("researcher.badge_synthetic_only")}
              </span>
              <span className="clinical-badge bg-slate-800 border border-slate-700 text-slate-300">
                <FileText className="w-3 h-3 mr-1.5" />
                {t("researcher.badge_cpic_version")}
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
            {t("researcher.back_to_patient")}
          </button>

          <h2 className="text-3xl font-semibold text-slate-100 mb-2">
            {t("researcher.title")}
          </h2>
          <p className="text-slate-400 max-w-2xl">
            {t("researcher.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-700 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("vcf")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === "vcf"
                ? "border-teal-500 text-teal-400 bg-teal-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Beaker className="w-4 h-4" />
            {t("researcher.tab_vcf")}
          </button>

          <button
            onClick={() => setActiveTab("vus")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === "vus"
                ? "border-purple-500 text-purple-400 bg-purple-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Search className="w-4 h-4" />
            {t("researcher.tab_vus")}
          </button>

          <button
            onClick={() => setActiveTab("heatmap")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === "heatmap"
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Map className="w-4 h-4" />
            {t("researcher.tab_heatmap")}
          </button>

          <button
            onClick={() => setActiveTab("rwe")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === "rwe"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Activity className="w-4 h-4" />
            {t("researcher.tab_rwe")}
          </button>

          <button
            onClick={() => setActiveTab("evidence")}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === "evidence"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }
            `}
          >
            <Database className="w-4 h-4" />
            {t("researcher.tab_evidence")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "vcf" && <div className="animate-fade-in"><SyntheticVcfGenerator /></div>}
          {activeTab === "vus" && <div className="animate-fade-in"><VusDiscovery /></div>}
          {activeTab === "heatmap" && <div className="animate-fade-in"><PopulationHeatmap /></div>}
          {activeTab === "rwe" && <div className="animate-fade-in"><RweFeedbackLoop /></div>}
          {activeTab === "evidence" && <div className="animate-fade-in"><CpicEvidenceExplorer /></div>}
        </div>

      </div>


    </div>
  );
}
