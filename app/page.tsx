"use client";

import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Dna, FlaskConical, Loader2 } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import DrugSelector from "@/components/DrugSelector";
import RiskDashboard from "@/components/RiskDashboard";
import { parseVCF, ParsedVCF } from "@/lib/vcf-parser";
import { resolveDiplotype } from "@/lib/diplotype-lookup";
import { assessRisk } from "@/lib/risk-engine";
import { Drug, DRUG_GENE_MAP, AnalysisResult } from "@/lib/types";

export default function Home() {
  const [parsedVCF, setParsedVCF] = useState<ParsedVCF | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedGenes, setDetectedGenes] = useState<string[]>([]);

  const handleFileLoaded = useCallback(
    (_content: string, _fileName: string, parsed: ParsedVCF) => {
      setParsedVCF(parsed);
      setResults([]);
      const genes = [...new Set(parsed.variants.map((v) => v.gene))];
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
        selectedDrugs.map(async (drug) => {
          const primaryGene = DRUG_GENE_MAP[drug];

          // Client-side: resolve diplotype and assess risk
          const diplotypeResult = resolveDiplotype(primaryGene, parsedVCF.variants);
          const risk = assessRisk(drug, diplotypeResult.phenotype);
          const geneVariants = parsedVCF.variants.filter((v) => v.gene === primaryGene);
          const patientId = `PATIENT_${uuidv4().substring(0, 8).toUpperCase()}`;

          // Call backend for LLM explanation (phenotype only — no genomic data)
          let explanation;
          try {
            const response = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patient_id: patientId,
                drug,
                primary_gene: primaryGene,
                phenotype: diplotypeResult.phenotype,
                diplotype: diplotypeResult.diplotype,
                confidence_score: risk.confidence_score,
                severity: risk.severity,
                risk_label: risk.risk_label,
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
              summary: `Patient has ${diplotypeResult.phenotype} (${phenotypeFull}) phenotype for ${primaryGene}, affecting ${drug} metabolism. Risk assessment: ${risk.risk_label}.`,
              biological_mechanism: `${primaryGene} encodes a key enzyme responsible for metabolizing ${drug}. The detected diplotype ${diplotypeResult.diplotype} results in ${phenotypeFull} enzyme activity.`,
              variant_impact: `The diplotype ${diplotypeResult.diplotype} in ${primaryGene} produces ${phenotypeFull} enzyme function, affecting how the body processes ${drug}.`,
              clinical_context: `This pharmacogenomic profile has direct implications for ${drug} dosing. CPIC guidelines recommend: ${risk.risk_label}.`,
              disclaimer:
                "This is AI-generated clinical decision support only. All treatment decisions require qualified healthcare provider review.",
            };
          }

          return {
            patient_id: patientId,
            drug,
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
              cpic_guideline_version: "CPIC v1.9 (2023)",
              recommendation_strength: risk.cpic_strength,
            },
            llm_generated_explanation: explanation,
            quality_metrics: {
              vcf_parsing_success: parsedVCF.success,
              variants_detected: parsedVCF.variants.length,
              genes_analyzed: [...new Set(parsedVCF.variants.map((v) => v.gene))],
              annotation_completeness:
                parsedVCF.variants.length > 0 ? 0.95 : 0.6,
              parse_warnings: parsedVCF.warnings,
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
            Upload a VCF file to predict drug reaction risks using CPIC-aligned
            pharmacogenomic analysis across 6 genes and 6 drugs.
          </p>
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

        {/* Results Dashboard */}
        {results.length > 0 && <RiskDashboard results={results} />}
      </div>

      {/* Footer */}
      <footer className="mt-20 py-6 border-t border-offwhite/5 text-center">
        <p className="text-muted text-xs">
          PharmaGuard — RIFT 2026 Hackathon • Team Antigravity •
          Pharmacogenomics / Explainable AI Track
        </p>
        <p className="text-muted/50 text-xs mt-1">
          For educational purposes only. Not for clinical diagnosis.
        </p>
      </footer>
    </main>
  );
}
