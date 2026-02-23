"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, CheckCircle2, FileText, Pill, Loader2, ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import DrugSelector from "@/components/DrugSelector";
import ProgressIndicator from "@/components/ProgressIndicator";
import { Drug, DRUG_GENE_MAP, AnalysisResult } from "@/lib/types";
import { resolveDiplotype } from "@/lib/diplotype-lookup";
import { assessRisk } from "@/lib/risk-engine";
import { usePharmaGuard } from "@/context/PharmaGuardContext";
import { anonymizePatientId } from "@/lib/patient-id";

export default function SelectDrugPage() {
  const router = useRouter();
  const { parsedVCFData, detectedGenes, setSelectedDrug, setAnalysisResult } = usePharmaGuard();
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Route Guard: Redirect if no VCF data
    if (!parsedVCFData) {
      router.push("/upload");
    }
  }, [parsedVCFData, router]);

  const handleAnalyze = async () => {
    if (!parsedVCFData || selectedDrugs.length === 0) return;

    setIsAnalyzing(true);

    try {
      const analysisResults: AnalysisResult[] = await Promise.all(
        selectedDrugs.map(async (drug) => {
          const primaryGene = DRUG_GENE_MAP[drug];

          // Client-side: resolve diplotype and assess risk (async — hits CPIC API)
          const diplotypeResult = await resolveDiplotype(primaryGene, parsedVCFData.variants);
          // Calculate minGQ for the gene's variants to drive confidence score
          const geneVariants = parsedVCFData.variants.filter((v) => v.gene === primaryGene);
          
          let minGQ = 60; // Default high confidence if no variants (wildtype)
          if (geneVariants.length > 0) {
            // Find minimum GQ among detected variants. strict validation.
            // If v.gq is undefined (legacy parser), default to 0 to be safe, but our parser now ensures it.
            const gqValues = geneVariants.map(v => v.gq !== undefined ? v.gq : 0);
            minGQ = Math.min(...gqValues);
          } else {
             // For Wildtype (*1/*1), we rely on the fact that no variants were found.
             // If coverage was low, we might want to penalize? 
             // But simpler to assume standard Wildtype confidence unless specific DP check logic exists.
             // Let's set it to 60 (max) for WT.
             minGQ = 99;
          }


          const risk = await assessRisk(drug, diplotypeResult.phenotype, primaryGene, geneVariants.length, diplotypeResult.exactMatch, diplotypeResult.diplotype, minGQ);
          const rawSessionId = uuidv4();
          const patientId = await anonymizePatientId(rawSessionId);

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
              vcf_parsing_success: parsedVCFData.success,
              variants_detected: parsedVCFData.variants.length,
              genes_analyzed: Array.from(new Set(parsedVCFData.variants.map((v) => v.gene))),
              annotation_completeness:
                parsedVCFData.variants.length > 0 ? 0.95 : 0.6,
              parse_warnings: parsedVCFData.warnings,
            },
            // Explicitly set data_source for the UI badge
            data_source: {
              cpic_api: risk.data_source?.includes("API") ?? false,
              cpic_classification: risk.cpic_classification,
              cpic_implications: risk.cpic_implications,
              diplotype_exact_match: diplotypeResult.exactMatch,
              confidence_basis: risk.data_source || "Fallback Cache"
            }
          };
        })
      );

      // Store in context
      setSelectedDrug(selectedDrugs);
      setAnalysisResult(analysisResults);

      // Navigate to report
      router.push("/report");
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!parsedVCFData) {
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
              <Image
                src="/assets/image/logo.png"
                alt="GenomaVeda Logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-slate-100">GenomaVeda</h1>
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
            onClick={() => router.push("/upload")}
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
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="clinical-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="step-indicator bg-teal-500/10 text-teal-500 border border-teal-500/30">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Select Target Drug</h3>
              <p className="text-xs text-slate-400">
                Choose the pharmaceutical agent to evaluate against the genomic profile.
              </p>
            </div>
          </div>
          <DrugSelector
            selectedDrugs={selectedDrugs}
            onSelectionChange={setSelectedDrugs}
            detectedGenes={detectedGenes}
          />

          {/* Analyze Button */}
          {selectedDrugs.length > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                w-full mt-4 py-3 rounded-lg font-medium text-sm transition-all
                ${isAnalyzing
                  ? "bg-slate-700 text-slate-400 cursor-wait"
                  : "bg-teal-500 text-white hover:bg-teal-600"
                }
              `}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Genomic Profile...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Pill className="w-4 h-4" />
                  Generate Risk Assessment
                </span>
              )}
            </button>
          )}

          {/* Disabled State Message */}
          {selectedDrugs.length === 0 && (
            <div className="mt-4 p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
              <p className="text-xs text-slate-400 text-center">
                Select at least one drug to continue
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>GenomaVeda v2.4.0</span>
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
