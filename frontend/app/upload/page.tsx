"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, CheckCircle2, FileText, Beaker } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ProgressIndicator from "@/components/ProgressIndicator";
import { parseVCF, ParsedVCF } from "@/lib/vcf-parser";
import { usePharmaGuard } from "@/context/PharmaGuardContext";
import { isPrivateBrowsing, checkEviction, saveToVault } from "@/lib/db";
import { AlertCircle, FileWarning } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function UploadPage() {
  const router = useRouter();
  const { setParsedVCFData, setDetectedGenes } = usePharmaGuard();
  const { t } = useTranslation();
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [evicted, setEvicted] = React.useState(false);

  React.useEffect(() => {
    isPrivateBrowsing().then(setIsPrivate);
    checkEviction().then(res => {
      // If res is false, it might have been evicted or not persisted
      setEvicted(!res);
    });
  }, []);

  const handleFileLoaded = useCallback(
    (_content: string, _fileName: string, parsed: ParsedVCF) => {
      const genes = Array.from(new Set(parsed.variants.map((v) => v.gene)));

      // Store in context
      setParsedVCFData(parsed);
      setDetectedGenes(genes);

      // Store to IndexedDB vault securely
      // Extract pseudo-patient ID or formulate one
      const patientId = "SESSION-" + Math.random().toString(36).substr(2, 8).toUpperCase();

      const vaultData = {
        type: "vcf_session" as const,
        patient_id: patientId,
        phenotype_profiles: parsed.variants.map(v => ({ gene: v.gene, diplotype: v.star_allele || "*1/*1", phenotype: "Unknown" }))
      };

      saveToVault(patientId, vaultData).then(() => {
        // Navigate to drug selection
        router.push("/select-drug");
      }).catch(err => {
        console.error("Vault save failed:", err);
        router.push("/select-drug");
      });
    },
    [router, setParsedVCFData, setDetectedGenes]
  );

  return (
    <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      style={{
        animation: "fadeIn 0.5s ease-in forwards"
      }}
    >
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
                <h1 className="text-xl font-bold text-slate-100 tracking-wide" style={{ fontFamily: "Syne, sans-serif" }}>GenomaVeda</h1>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/researcher")}
                className="clinical-badge bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors cursor-pointer"
              >
                <Beaker className="w-3 h-3 mr-1.5" />
                RESEARCHER SANDBOX
              </button>
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
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">
          {t("flow.title")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("flow.subtitle_upload")}
        </p>

        {isPrivate && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 animate-pulse">
            <FileWarning className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t("flow.private_browsing_title")}</p>
              <p className="text-xs opacity-80">{t("flow.private_browsing_body")}</p>
            </div>
          </div>
        )}

        {evicted && !isPrivate && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-crimson-500/10 border border-crimson-500/30 rounded-lg text-crimson-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t("flow.vault_eviction_title")}</p>
              <p className="text-xs opacity-80">{t("flow.vault_eviction_body")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="clinical-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="step-indicator bg-teal-500/10 text-teal-500 border border-teal-500/30">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{t("flow.step1_title")}</h3>
              <p className="text-xs text-slate-400">
                {t("flow.step1_body")}
              </p>

            </div>
          </div>
          <Dropzone onFileLoaded={handleFileLoaded} parseVCF={parseVCF} />
        </div>
      </div>



      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
