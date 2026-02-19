import { z } from "zod";

// ─── Enums (now flexible strings for dynamic data) ──────────────
// Previously hardcoded to 6 drugs/genes. Now accepts any string
// that passes through CPIC API validation.

export const PhenotypeEnum = z.enum(["PM", "IM", "NM", "RM", "URM", "Unknown"]);

export const RiskLabelEnum = z.enum([
  "Safe",
  "Adjust Dosage",
  "Toxic",
  "Ineffective",
  "Unknown",
]);

export const SeverityEnum = z.enum(["none", "low", "moderate", "high", "critical"]);

// ─── Request Schema (for /api/analyze) ──────────────────────────
export const AnalyzeRequestSchema = z.object({
  patient_id: z.string(),
  drug: z.string().min(1),             // Dynamic: accepts any CPIC drug
  primary_gene: z.string().min(1),     // Dynamic: accepts any gene symbol
  phenotype: PhenotypeEnum,
  diplotype: z.string(),
  confidence_score: z.number().min(0).max(1),
  severity: SeverityEnum,
  risk_label: RiskLabelEnum,
  // Optional CPIC context for LLM grounding
  cpic_context: z.object({
    raw_recommendation: z.string(),
    classification: z.string(),
    implications: z.string(),
  }).optional(),
}).refine(
  (data) => data.drug === data.drug.toUpperCase(),
  { message: "Drug must be uppercase" }
);

// Block genomic data fields from reaching the backend
export const BLOCKED_FIELDS = ["variants", "rsid", "vcf", "star_allele", "chromosome", "position"];

// ─── Detected Variant Schema ────────────────────────────────────
const DetectedVariantSchema = z.object({
  rsid: z.string(),
  gene: z.string(),
  chromosome: z.string(),
  position: z.number(),
  ref_allele: z.string(),
  alt_allele: z.string(),
  zygosity: z.enum(["homozygous", "heterozygous", "hemizygous"]),
  star_allele: z.string(),
  clinical_significance: z.string(),
});

// ─── LLM Explanation Schema ─────────────────────────────────────
export const LLMExplanationSchema = z.object({
  summary: z.string(),
  biological_mechanism: z.string(),
  variant_impact: z.string(),
  clinical_context: z.string(),
  disclaimer: z.string(),
});

// ─── Full Analysis Result Schema ────────────────────────────────
export const AnalysisResultSchema = z.object({
  patient_id: z.string(),
  drug: z.string(),
  timestamp: z.string(),
  risk_assessment: z.object({
    risk_label: RiskLabelEnum,
    confidence_score: z.number().min(0).max(1),
    severity: SeverityEnum,
  }),
  pharmacogenomic_profile: z.object({
    primary_gene: z.string(),
    diplotype: z.string(),
    phenotype: PhenotypeEnum,
    detected_variants: z.array(DetectedVariantSchema),
  }),
  clinical_recommendation: z.object({
    primary_recommendation: z.string(),
    dose_adjustment: z.string(),
    alternative_drugs: z.array(z.string()),
    monitoring_required: z.boolean(),
    cpic_guideline_version: z.string(),
    recommendation_strength: z.enum(["strong", "moderate", "optional"]),
  }),
  llm_generated_explanation: LLMExplanationSchema,
  quality_metrics: z.object({
    vcf_parsing_success: z.boolean(),
    variants_detected: z.number(),
    genes_analyzed: z.array(z.string()),
    annotation_completeness: z.number(),
    parse_warnings: z.array(z.string()),
  }),
  // Optional dynamic data source metadata
  data_source: z.object({
    cpic_api: z.boolean(),
    cpic_classification: z.string(),
    cpic_implications: z.string(),
    diplotype_exact_match: z.boolean(),
    confidence_basis: z.string(),
  }).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalysisResultZod = z.infer<typeof AnalysisResultSchema>;
