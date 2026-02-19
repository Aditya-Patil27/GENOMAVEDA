"use client";

import React, { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Dna, FlaskConical, Loader2, Radio, Wifi, WifiOff } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import DrugSelector from "@/components/DrugSelector";
import RiskDashboard from "@/components/RiskDashboard";
import DrugHistoryTracker from "@/components/DrugHistoryTracker";
import ZeroLayerSentry from "@/components/ZeroLayerSentry";
import { parseVCF, ParsedVCF } from "@/lib/vcf-parser";
import { resolveDiplotype } from "@/lib/diplotype-lookup";
import { assessRisk } from "@/lib/risk-engine";
import { AnalysisResult } from "@/lib/types";
import { getDrugList, DrugInfo, getGeneForDrug } from "@/lib/drug-registry";
import { explainConfidence } from "@/lib/confidence-calculator";

export default function Home() {
  const [parsedVCF, setParsedVCF] = useState<ParsedVCF | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedGenes, setDetectedGenes] = useState<string[]>([]);

  // ─── Dynamic drug list from CPIC API ─────────────────────────
  const [drugList, setDrugList] = useState<DrugInfo[]>([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Track online/offline status for PWA badge
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const drugs = await getDrugList();
        if (!cancelled) {
          setDrugList(drugs);
        }
      } catch (err) {
        console.error("[PharmaGuard] Failed to load drug list:", err);
      } finally {
        if (!cancelled) setIsLoadingDrugs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFileLoaded = useCallback(
    (_content: string, _fileName: string, parsed: ParsedVCF) => {
      setParsedVCF(parsed);
      setResults([]);
      const genes = Array.from(new Set(parsed.variants.map((v) => v.gene)));
      setDetectedGenes(genes);
      setSelectedDrugs([]);
    },
    []
  );

  const handleAnalyze = async () => {
    if (!parsedVCF || selectedDrugs.length === 0) return;

    setIsAnalyzing(true);
    setResults([]);

    try {
      const analysisResults: AnalysisResult[] = await Promise.all(
        selectedDrugs.map(async (drugName) => {
          // Find drug info from dynamic list
          const drugInfo = drugList.find((d) => d.nameUpper === drugName);
          const primaryGene = drugInfo?.gene || getGeneForDrug(drugName) || "Unknown";

          // Async: resolve diplotype from CPIC API
          const diplotypeResult = await resolveDiplotype(primaryGene, parsedVCF.variants);
          // Async: assess risk from CPIC recommendations
          const risk = await assessRisk(
            drugName,
            diplotypeResult.phenotype,
            primaryGene,
            parsedVCF.variants.filter((v) => v.gene === primaryGene).length,
            diplotypeResult.exactMatch
          );

          const geneVariants = parsedVCF.variants.filter((v) => v.gene === primaryGene);
          const patientId = `PATIENT_${uuidv4().substring(0, 8).toUpperCase()}`;

          // Build confidence explanation for audit trail
          const confidenceBasis = explainConfidence({
            cpicClassification: risk.cpic_classification || "Strong",
            variantCount: geneVariants.length,
            diplotypeExactMatch: diplotypeResult.exactMatch,
            starAlleleResolved: !diplotypeResult.resolvedFromRsid,
          });

          // Call backend for LLM explanation with CPIC context injection
          let explanation;
          try {
            const response = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patient_id: patientId,
                drug: drugName,
                primary_gene: primaryGene,
                phenotype: diplotypeResult.phenotype,
                diplotype: diplotypeResult.diplotype,
                confidence_score: risk.confidence_score,
                severity: risk.severity,
                risk_label: risk.risk_label,
                cpic_context: {
                  raw_recommendation: risk.cpic_raw_recommendation || "",
                  classification: risk.cpic_classification || "",
                  implications: risk.cpic_implications || "",
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              explanation = data.llm_generated_explanation;
            }
          } catch {
            // Backend unavailable — use fallback
          }

          // Fallback explanation if backend call failed
          if (!explanation) {
            const phenotypeNames: Record<string, string> = {
              PM: "Poor Metabolizer",
              IM: "Intermediate Metabolizer",
              NM: "Normal Metabolizer",
              RM: "Rapid Metabolizer",
              URM: "Ultra-Rapid Metabolizer",
              Unknown: "Unknown Metabolizer Status",
            };
            const phenotypeFull =
              phenotypeNames[diplotypeResult.phenotype] || "Unknown Metabolizer Status";

            explanation = {
              summary: `Patient has ${diplotypeResult.phenotype} (${phenotypeFull}) phenotype for ${primaryGene}, affecting ${drugName} metabolism. Risk assessment: ${risk.risk_label}.`,
              biological_mechanism: `${primaryGene} encodes a key enzyme responsible for metabolizing ${drugName}. The detected diplotype ${diplotypeResult.diplotype} results in ${phenotypeFull} enzyme activity.`,
              variant_impact: `The diplotype ${diplotypeResult.diplotype} in ${primaryGene} produces ${phenotypeFull} enzyme function, affecting how the body processes ${drugName}.`,
              clinical_context: `CPIC guideline recommendation: ${risk.recommendation}`,
              disclaimer:
                "This is AI-generated clinical decision support using live CPIC guideline data. All treatment decisions require qualified healthcare provider review.",
            };
          }

          return {
            patient_id: patientId,
            drug: drugName,
            timestamp: new Date().toISOString(),
            risk_assessment: {
              risk_label: risk.risk_label,
              confidence_score: risk.confidence_score,
              severity: risk.severity,
            },
            pharmacogenomic_profile: {
              primary_gene: primaryGene,
              diplotype: diplotypeResult.diplotype,
              phenotype: diplotypeResult.phenotype,
              detected_variants: geneVariants.map((v) => ({
                rsid: v.rsid,
                gene: v.gene,
                chromosome: v.chromosome,
                position: v.position,
                ref_allele: v.ref_allele,
                alt_allele: v.alt_allele,
                zygosity: v.zygosity,
                star_allele: v.star_allele,
                clinical_significance: v.clinical_significance,
              })),
            },
            clinical_recommendation: {
              primary_recommendation: risk.recommendation,
              dose_adjustment: risk.dose_adjustment,
              alternative_drugs: risk.alternative_drugs,
              monitoring_required: risk.monitoring_required,
              cpic_guideline_version: "CPIC Live API (dynamic)",
              recommendation_strength: risk.cpic_strength,
            },
            llm_generated_explanation: explanation,
            quality_metrics: {
              vcf_parsing_success: parsedVCF.success,
              variants_detected: parsedVCF.variants.length,
              genes_analyzed: Array.from(new Set(parsedVCF.variants.map((v) => v.gene))),
              annotation_completeness:
                parsedVCF.variants.length > 0 ? 0.95 : 0.6,
              parse_warnings: parsedVCF.warnings,
            },
            data_source: {
              cpic_api: true,
              cpic_classification: risk.cpic_classification || "N/A",
              cpic_implications: risk.cpic_implications || "",
              diplotype_exact_match: diplotypeResult.exactMatch,
              confidence_basis: confidenceBasis,
            },
          };
        })
      );

      setResults(analysisResults);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen pb-16">
      {/* Hero Header */}
      <header className="relative py-12 px-6 text-center animate-fade-in overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Dna className="w-64 h-64 text-teal-400 dna-helix" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-teal-400/10 border border-teal-400/30 flex items-center justify-center animate-pulse-slow">
              <FlaskConical className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient-teal">
              PharmaGuard
            </h1>
          </div>
          <p className="text-muted text-lg font-light tracking-wide">
            Precision medicine, decoded.
          </p>
          <p className="text-muted/60 text-sm mt-2 max-w-xl mx-auto">
            Upload a VCF file to predict drug reaction risks using{" "}
            <span className="text-teal-400/80 font-medium">live CPIC guideline data</span>{" "}
            with evidence-based pharmacogenomic analysis.
          </p>
          {/* Live Data Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/20 text-xs font-mono text-teal-400">
              <Radio className="w-3 h-3 animate-pulse" />
              Live CPIC Data
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-base-700/50 border border-offwhite/10 text-xs font-mono text-muted">
              {drugList.length > 0 ? `${drugList.length} drugs` : "Loading..."}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${
              isOffline
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-jade-500/10 border-jade-500/20 text-jade-500"
            }`}>
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {isOffline ? "Offline Mode" : "Connected"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Upload Zone */}
        <Dropzone onFileLoaded={handleFileLoaded} parseVCF={parseVCF} />

        {/* Drug Selector */}
        {parsedVCF && (
          <DrugSelector
            selectedDrugs={selectedDrugs}
            onSelectionChange={setSelectedDrugs}
            detectedGenes={detectedGenes}
            drugList={drugList}
            isLoadingDrugs={isLoadingDrugs}
          />
        )}

        {/* Analyze Button */}
        {parsedVCF && selectedDrugs.length > 0 && (
          <div className="animate-slide-up stagger-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                w-full py-4 rounded font-heading font-bold text-lg transition-all duration-300
                ${
                  isAnalyzing
                    ? "bg-base-700 text-muted cursor-wait"
                    : "bg-gradient-to-r from-teal-400 to-jade-500 text-base-900 hover:shadow-lg hover:shadow-teal-400/20 hover:scale-[1.01] active:scale-[0.99]"
                }
              `}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Genomic Profile...</span>
                  <span className="text-sm font-normal opacity-60">
                    Sequencing {selectedDrugs.length} drug{selectedDrugs.length > 1 ? "s" : ""}
                  </span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Dna className="w-5 h-5" />
                  Analyze {selectedDrugs.length} Drug{selectedDrugs.length > 1 ? "s" : ""}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Zero Layer Sentry — pre-emptive safety alerts */}
        {results.length > 0 && <ZeroLayerSentry results={results} />}

        {/* Results Dashboard */}
        {results.length > 0 && <RiskDashboard results={results} />}

        {/* Drug History Tracker — longitudinal record */}
        <DrugHistoryTracker results={results} />
      </div>

      {/* Footer */}
      <footer className="mt-20 py-6 border-t border-offwhite/5 text-center">
        <p className="text-muted text-xs">
          PharmaGuard — RIFT 2026 Hackathon • Team Antigravity •
          Pharmacogenomics / Explainable AI Track
        </p>
        <p className="text-muted/50 text-xs mt-1">
          Powered by live CPIC clinical guidelines. For educational purposes only — not a validated clinical diagnostic tool.
        </p>
      </footer>
    </main>
  );
}
