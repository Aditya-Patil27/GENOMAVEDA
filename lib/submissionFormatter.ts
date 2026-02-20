import { AnalysisResult } from "./types";

/**
 * Format analysis result to minimal PS submission JSON
 * Only includes required fields, removes extra nested details
 */
export function formatToMinimalSubmissionJson(result: AnalysisResult): any {
  return {
    patient_id: result.patient_id,
    drug: result.drug,
    timestamp: result.timestamp,
    risk_assessment: {
      risk_label: result.risk_assessment.risk_label,
      confidence_score: result.risk_assessment.confidence_score,
      severity: result.risk_assessment.severity,
    },
    pharmacogenomic_profile: {
      primary_gene: result.pharmacogenomic_profile.primary_gene,
      diplotype: result.pharmacogenomic_profile.diplotype,
      phenotype: result.pharmacogenomic_profile.phenotype,
      detected_variants: result.pharmacogenomic_profile.detected_variants.map(v => ({
        rsid: v.rsid,
      })),
    },
    clinical_recommendation: result.clinical_recommendation,
    llm_generated_explanation: {
      summary: result.llm_generated_explanation.summary,
    },
    quality_metrics: {
      vcf_parsing_success: result.quality_metrics.vcf_parsing_success,
    },
  };
}
