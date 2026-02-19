/**
 * Evidence-Based Confidence Calculator
 *
 * Replaces hardcoded confidence scores (0.92, 0.85, etc.) with a formula
 * grounded in CPIC evidence levels and variant match quality.
 *
 * confidence = baseScore(cpicLevel) + variantBonus + matchBonus
 * Capped at 0.99 (never claim 100% certainty for clinical predictions).
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
 * @returns A confidence score between 0.10 and 0.99
 *
 * Formula breakdown:
 * - Base: 0.90 (Strong), 0.75 (Moderate), 0.60 (Optional)
 * - Variant count bonus: +0.03 per variant, max +0.10
 * - Exact diplotype match: +0.05 (matched in CPIC DB), or −0.15 (inferred)
 * - Star allele resolution: −0.05 if resolved from rsID (vs direct STAR= tag)
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  // 1. Base score from CPIC evidence level
  const classification = factors.cpicClassification.toLowerCase();
  const baseScore = CLASSIFICATION_BASE_SCORE[classification] ?? 0.50;

  // 2. Variant count bonus (more variants detected = higher confidence in genotype)
  const variantBonus = Math.min(factors.variantCount * 0.03, 0.10);

  // 3. Diplotype match quality
  const matchBonus = factors.diplotypeExactMatch ? 0.05 : -0.15;

  // 4. Star allele resolution penalty (rsID→star is less certain than direct STAR= tag)
  const resolutionPenalty = factors.starAlleleResolved ? 0 : -0.05;

  // 5. Combine and clamp
  const raw = baseScore + variantBonus + matchBonus + resolutionPenalty;
  const clamped = Math.max(0.10, Math.min(raw, 0.99));

  return parseFloat(clamped.toFixed(2));
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
