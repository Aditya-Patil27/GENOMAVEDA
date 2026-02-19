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
}

export type Drug = "CODEINE" | "WARFARIN" | "CLOPIDOGREL" | "SIMVASTATIN" | "AZATHIOPRINE" | "FLUOROURACIL";

export type Gene = "CYP2D6" | "CYP2C19" | "CYP2C9" | "SLCO1B1" | "TPMT" | "DPYD";

export const DRUG_GENE_MAP: Record<Drug, Gene> = {
  CODEINE: "CYP2D6",
  CLOPIDOGREL: "CYP2C19",
  WARFARIN: "CYP2C9",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

export const ALL_DRUGS: Drug[] = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL",
];
