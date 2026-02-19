import { AnalysisResult } from "./types";
import { AnalysisResultSchema } from "./zodSchemas";

/**
 * Format analysis result to PS-compliant JSON (strict schema)
 * This matches the exact required schema for submission
 */
export function formatToPSJson(result: AnalysisResult): AnalysisResult {
  // Return only the core required fields, no extras
  const psCompliant: AnalysisResult = {
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
      primary_recommendation: result.clinical_recommendation.primary_recommendation,
      dose_adjustment: result.clinical_recommendation.dose_adjustment,
      alternative_drugs: result.clinical_recommendation.alternative_drugs,
      monitoring_required: result.clinical_recommendation.monitoring_required,
      cpic_guideline_version: result.clinical_recommendation.cpic_guideline_version,
      recommendation_strength: result.clinical_recommendation.recommendation_strength,
    },
    llm_generated_explanation: {
      summary: result.llm_generated_explanation.summary,
      biological_mechanism: result.llm_generated_explanation.biological_mechanism,
      variant_impact: result.llm_generated_explanation.variant_impact,
      clinical_context: result.llm_generated_explanation.clinical_context,
      disclaimer: result.llm_generated_explanation.disclaimer,
    },
    quality_metrics: {
      vcf_parsing_success: result.quality_metrics.vcf_parsing_success,
      variants_detected: result.quality_metrics.variants_detected,
      genes_analyzed: result.quality_metrics.genes_analyzed,
      annotation_completeness: result.quality_metrics.annotation_completeness,
      parse_warnings: result.quality_metrics.parse_warnings,
    },
  };

  return psCompliant;
}

/**
 * Format analysis result to extended internal JSON (full structure)
 * Includes all metadata, debug fields, and optional data
 */
export function formatToExtendedJson(result: AnalysisResult): any {
  // Return the full structure including optional fields
  return {
    ...result,
    _metadata: {
      export_format: "extended",
      export_timestamp: new Date().toISOString(),
      genomaveda_version: "v2.4.0",
    },
  };
}

/**
 * Validate PS-compliant JSON against Zod schema
 * Returns validation result
 */
export function validatePSJson(data: any): { success: boolean; error?: string } {
  try {
    AnalysisResultSchema.parse(data);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Validation failed",
    };
  }
}
