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
  genes_missing: z.array(z.string()).optional(),
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
  pharmacogenomic_profile: z.object({
    primary_gene: z.string(),
    diplotype: z.string(),
    phenotype: z.string(), // Now strings since there are many phenotypes
    detected_variants: z.array(DetectedVariantSchema),
  }),
  risk_assessment: z.object({
    risk_label: z.string(),
    severity: z.string(),
    confidence_score: z.number().min(0).max(1),
    clinical_recommendation: z.string(),
    llm_generated_explanation: z.string(),
  }),
  quality_metrics: z.object({
    vcf_parsing_success: z.boolean(),
    genes_missing: z.array(z.string()),
    privacy_audit: z.object({
      raw_vcf_retained_on_server: z.literal(false),
      variants_processed_locally: z.literal(true),
      data_sent_to_llm: z.enum(["phenotype_label_only", "none"]),
      differential_privacy_applied: z.boolean(),
    }).optional(),
  }),

  // Optional dynamic data source metadata
  data_source: z.object({
    cpic_api: z.boolean(),
    cpic_classification: z.string(),
    cpic_implications: z.string(),
    diplotype_exact_match: z.boolean(),
    confidence_basis: z.string(),
  }).optional(),
  // F4: Prompt transparency log — shows exact LLM prompt for XAI
  prompt_log: z.object({
    system_prompt: z.string(),
    user_prompt: z.string(),
    phi_excluded: z.array(z.string()),
    cpic_context_source: z.string(),
    model: z.string(),
    tokens_estimated: z.number(),
  }).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalysisResultZod = z.infer<typeof AnalysisResultSchema>;
