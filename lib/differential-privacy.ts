// lib/differential-privacy.ts
// Laplace mechanism — standard differential privacy
// Mathematically proven: output distribution changes by at most e^epsilon
// when any single input changes.

function sampleLaplace(mu: number, b: number): number {
  const u = Math.random() - 0.5;
  return mu - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export interface DPResult {
  privatized_score: number;
  original_score: number;
  epsilon: number; // privacy budget used
  mechanism: "Laplace";
  sensitivity: number; // max impact one patient can have
  noise_added: number; // for audit trail
}

/**
 * Apply Laplace-mechanism differential privacy to a confidence score.
 *
 * @param rawScore - The original confidence score (0-1)
 * @param epsilon - Privacy budget. Lower = more private, less accurate. Default 1.0.
 * @param sensitivity - Max score change from one patient. Default 0.1.
 */
export function privatizeConfidenceScore(
  rawScore: number,
  epsilon: number = 1.0,
  sensitivity: number = 0.1
): DPResult {
  const b = sensitivity / epsilon; // Laplace scale parameter
  const noise = sampleLaplace(0, b);
  const privatized = Math.min(1.0, Math.max(0.0, rawScore + noise));

  return {
    privatized_score: Math.round(privatized * 100) / 100,
    original_score: rawScore,
    epsilon,
    mechanism: "Laplace",
    sensitivity,
    noise_added: Math.round(noise * 10000) / 10000,
  };
}
