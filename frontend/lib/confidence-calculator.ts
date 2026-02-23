import { privatizeConfidenceScore, DPResult } from "./differential-privacy";

/**
 * Evidence-Based Confidence Calculator
 *
 * Replaces hardcoded confidence scores (0.92, 0.85, etc.) with a formula
 * grounded in CPIC evidence levels and variant match quality.
 *
 * confidence = baseScore(cpicLevel) + variantBonus + matchBonus
 * Capped at 0.99 (never claim 100% certainty for clinical predictions).
 * F3: Laplace-mechanism differential privacy (ε=1.0) applied to output.
 */

// ─── Types ──────────────────────────────────────────────────────
export interface ConfidenceFactors {
  /** CPIC recommendation classification */
  cpicClassification: "Strong" | "Moderate" | "Optional" | string;
  /** Number of PGx variants detected in VCF for this gene */
  variantCount: number;
  /** Whether the diplotype was an exact match in CPIC database */
  diplotypeExactMatch: boolean;
  /** Whether the star allele was resolved from rsID (vs from STAR= tag) */
  starAlleleResolved: boolean;
  /** Minimum Genotype Quality (GQ) of detected variants (0-99) */
  minGQ?: number;
}

// ─── Score Tables ───────────────────────────────────────────────

/** Base score from CPIC recommendation classification level */
const CLASSIFICATION_BASE_SCORE: Record<string, number> = {
  strong: 0.90,
  moderate: 0.75,
  optional: 0.60,
};

// ─── Calculator ─────────────────────────────────────────────────

/**
 * Calculate evidence-based confidence score.
 *
 * @param factors - The evidence factors for this analysis
 * @returns A confidence score between 0.10 and 0.99 with DP applied
 *
 * Formula breakdown (Weighted Confidence Model):
 * C = α·Cvcf + β·Cann + γ·Cmodel
 *
 * 1. Cvcf = min(1, GQ/60)  [Genotype Call Quality]
 * 2. Cann = 1.0 if exact match, else 0.8 [Annotation Quality]
 * 3. Cmodel = 0.95 (Deterministic Rules) [Model Certainty]
 * Factors: α=0.4, β=0.3, γ=0.3
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  // 1. Cvcf: Genotype Quality
  // Default to 60 (high confidence) if minGQ not provided (e.g. legacy calls)
  const gq = factors.minGQ !== undefined ? factors.minGQ : 60;
  const c_vcf = Math.min(1.0, gq / 60.0);

  // 2. Cann: Annotation Quality (Diplotype match)
  const c_ann = factors.diplotypeExactMatch ? 1.0 : 0.8;

  // 3. Cmodel: Model Certainty (High for deterministic CPIC rules)
  // Downgrade slightly if star allele had to be inferred from RSID
  const c_model = factors.starAlleleResolved ? 0.95 : 0.90;

  // Weighted Sum
  const alpha = 0.4;
  const beta = 0.3;
  const gamma = 0.3;

  const raw = (alpha * c_vcf) + (beta * c_ann) + (gamma * c_model);
  
  // Clamp
  const clamped = Math.max(0.10, Math.min(raw, 0.99));

  // 6. F3: Apply differential privacy (Laplace, ε=1.0)
  const dp = privatizeConfidenceScore(clamped, 1.0, 0.1);

  return dp.privatized_score;
}

/**
 * Calculate confidence WITH full DP audit trail.
 * Returns both the privatized score and the audit metadata.
 */
export function calculateConfidenceWithDP(factors: ConfidenceFactors): DPResult {
  const classification = factors.cpicClassification.toLowerCase();
  const baseScore = CLASSIFICATION_BASE_SCORE[classification] ?? 0.50;
  const variantBonus = Math.min(factors.variantCount * 0.03, 0.10);
  const matchBonus = factors.diplotypeExactMatch ? 0.05 : -0.15;
  const resolutionPenalty = factors.starAlleleResolved ? 0 : -0.05;
  const raw = baseScore + variantBonus + matchBonus + resolutionPenalty;
  const clamped = Math.max(0.10, Math.min(raw, 0.99));

  return privatizeConfidenceScore(clamped, 1.0, 0.1);
}

/**
 * Calculate a simple confidence score when CPIC data is unavailable.
 * Used as fallback — produces lower scores to reflect uncertainty.
 */
export function calculateFallbackConfidence(
  variantCount: number,
  diplotypeExactMatch: boolean
): number {
  const baseScore = 0.50; // Unknown evidence level
  const variantBonus = Math.min(variantCount * 0.03, 0.10);
  const matchBonus = diplotypeExactMatch ? 0.05 : -0.15;

  const raw = baseScore + variantBonus + matchBonus;
  return parseFloat(Math.max(0.10, Math.min(raw, 0.99)).toFixed(2));
}

/**
 * Human-readable explanation of confidence score components.
 * Useful for audit trail / transparency in the UI.
 */
export function explainConfidence(factors: ConfidenceFactors): string {
  const classification = factors.cpicClassification.toLowerCase();
  const baseScore = CLASSIFICATION_BASE_SCORE[classification] ?? 0.50;
  const variantBonus = Math.min(factors.variantCount * 0.03, 0.10);
  const matchBonus = factors.diplotypeExactMatch ? 0.05 : -0.15;

  const parts: string[] = [];
  parts.push(`Base (CPIC ${factors.cpicClassification}): ${baseScore.toFixed(2)}`);
  parts.push(`Variant count (${factors.variantCount}): +${variantBonus.toFixed(2)}`);
  parts.push(
    `Diplotype match: ${factors.diplotypeExactMatch ? "+0.05 (exact)" : "-0.15 (inferred)"}`
  );
  if (!factors.starAlleleResolved) {
    parts.push("Star allele: -0.05 (resolved from rsID)");
  }

  return parts.join(" | ");
}
