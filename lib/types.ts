/**
 * Dynamic type definitions for PharmaGuard
 *
 * Previously hardcoded to 6 drugs/genes — now dynamic.
 * Types are flexible strings backed by runtime validation.
 */

export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: {
    risk_label: "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
    confidence_score: number;
    severity: "none" | "low" | "moderate" | "high" | "critical";
  };
  pharmacogenomic_profile: {
    primary_gene: string;
    diplotype: string;
    phenotype: "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
    detected_variants: Array<{
      rsid: string;
      gene: string;
      chromosome: string;
      position: number;
      ref_allele: string;
      alt_allele: string;
      zygosity: "homozygous" | "heterozygous" | "hemizygous";
      star_allele: string;
      clinical_significance: string;
    }>;
  };
  clinical_recommendation: {
    primary_recommendation: string;
    dose_adjustment: string;
    alternative_drugs: string[];
    monitoring_required: boolean;
    cpic_guideline_version: string;
    recommendation_strength: "strong" | "moderate" | "optional";
  };
  llm_generated_explanation: {
    summary: string;
    biological_mechanism: string;
    variant_impact: string;
    clinical_context: string;
    disclaimer: string;
  };
  quality_metrics: {
    vcf_parsing_success: boolean;
    variants_detected: number;
    genes_analyzed: string[];
    annotation_completeness: number;
    parse_warnings: string[];
  };
  /** Dynamic data source info (new) */
  data_source?: {
    cpic_api: boolean;
    cpic_classification: string;
    cpic_implications: string;
    diplotype_exact_match: boolean;
    confidence_basis: string;
  };
}

export interface LLMExplanation {
  summary: string;
  biological_mechanism: string;
  variant_impact: string;
  clinical_context: string;
  disclaimer: string;
}

export interface ExplainerInput {
  drug: string;
  gene: string;
  phenotype: string;
  diplotype: string;
  risk_label: string;
  /** Live CPIC guideline context for LLM grounding (new) */
  cpic_context?: {
    raw_recommendation: string;
    classification: string;
    implications: string;
  };
}

// ─── Legacy Compatibility ───────────────────────────────────────
// These are kept for backward compatibility but are now dynamically extended.

/** @deprecated Use DrugInfo from drug-registry.ts instead */
export type Drug = string;

/** @deprecated Use dynamic gene mapping from drug-registry.ts instead */
export type Gene = string;

/** @deprecated Use getDrugList() from drug-registry.ts instead */
export const DRUG_GENE_MAP: Record<string, string> = {
  CODEINE: "CYP2D6",
  CLOPIDOGREL: "CYP2C19",
  WARFARIN: "CYP2C9",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

/** @deprecated Use getDrugList() from drug-registry.ts instead */
export const ALL_DRUGS: string[] = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL",
];
