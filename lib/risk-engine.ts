import { getDrugRecommendations, classificationToStrength, CpicRecommendation } from "./cpic-client";
import { getDrugInfo } from "./drug-registry";
import { calculateConfidence, ConfidenceFactors } from "./confidence-calculator";

type Phenotype = "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
type Severity = "none" | "low" | "moderate" | "high" | "critical";

export interface RiskResult {
  risk_label: RiskLabel;
  severity: Severity;
  confidence_score: number;
  primary_gene: string;
  recommendation: string;
  dose_adjustment: string;
  alternative_drugs: string[];
  monitoring_required: boolean;
  cpic_strength: "strong" | "moderate" | "optional";
  /** Raw CPIC recommendation text (for LLM context injection) */
  cpic_raw_recommendation: string;
  /** CPIC classification level */
  cpic_classification: string;
  /** CPIC guideline implications */
  cpic_implications: string;
}

// ─── Phenotype Mapping ──────────────────────────────────────────
// Map our short phenotype codes to strings CPIC uses in lookupkey/phenotypes
const PHENOTYPE_CPIC_NAMES: Record<Phenotype, string[]> = {
  PM: ["Poor Metabolizer", "poor metabolizer"],
  IM: ["Intermediate Metabolizer", "intermediate metabolizer"],
  NM: ["Normal Metabolizer", "normal metabolizer", "Extensive Metabolizer"],
  RM: ["Rapid Metabolizer", "rapid metabolizer"],
  URM: ["Ultrarapid Metabolizer", "ultrarapid metabolizer", "Ultra-rapid Metabolizer"],
  Unknown: ["Unknown", "Indeterminate"],
};

/**
 * Assess drug-gene interaction risk using live CPIC recommendation data.
 * Falls back to static rules if CPIC API is unreachable.
 */
export async function assessRisk(
  drug: string,
  phenotype: Phenotype,
  gene: string,
  variantCount: number = 0,
  diplotypeExactMatch: boolean = true
): Promise<RiskResult> {
  const drugUpper = drug.toUpperCase().trim();

  // Look up drug in registry to get drugId
  const drugInfo = await getDrugInfo(drugUpper);

  if (!drugInfo || !drugInfo.drugId) {
    return unknownDrugResult(drugUpper, gene, variantCount, diplotypeExactMatch);
  }

  // Fetch recommendations from CPIC
  const recommendations = await getDrugRecommendations(drugInfo.drugId);

  if (!recommendations || recommendations.length === 0) {
    return unknownDrugResult(drugUpper, gene, variantCount, diplotypeExactMatch);
  }

  // Find the matching recommendation for this phenotype
  const matchingRec = findMatchingRecommendation(recommendations, phenotype, gene);

  if (!matchingRec) {
    // No specific recommendation for this phenotype — likely safe
    return buildResult({
      drug: drugUpper,
      gene: drugInfo.gene || gene,
      phenotype,
      recommendation: recommendations[0],
      isFallback: true,
      variantCount,
      diplotypeExactMatch,
    });
  }

  return buildResult({
    drug: drugUpper,
    gene: drugInfo.gene || gene,
    phenotype,
    recommendation: matchingRec,
    isFallback: false,
    variantCount,
    diplotypeExactMatch,
  });
}

// ─── Recommendation Matching ────────────────────────────────────

function findMatchingRecommendation(
  recommendations: CpicRecommendation[],
  phenotype: Phenotype,
  gene: string
): CpicRecommendation | null {
  const phenotypeNames = PHENOTYPE_CPIC_NAMES[phenotype] || [];

  // Try matching by phenotypes field
  for (const rec of recommendations) {
    if (rec.phenotypes && rec.phenotypes[gene]) {
      const recPhenotype = rec.phenotypes[gene].toLowerCase();
      if (phenotypeNames.some((p) => recPhenotype.includes(p.toLowerCase()))) {
        return rec;
      }
    }
  }

  // Try matching by lookupkey
  for (const rec of recommendations) {
    if (rec.lookupkey && rec.lookupkey[gene]) {
      const lookupVal = rec.lookupkey[gene].toLowerCase();
      if (phenotypeNames.some((p) => lookupVal.includes(p.toLowerCase()))) {
        return rec;
      }
    }
  }

  return null;
}

// ─── Result Building ────────────────────────────────────────────

interface BuildResultInput {
  drug: string;
  gene: string;
  phenotype: Phenotype;
  recommendation: CpicRecommendation;
  isFallback: boolean;
  variantCount: number;
  diplotypeExactMatch: boolean;
}

function buildResult(input: BuildResultInput): RiskResult {
  const rec = input.recommendation;
  const classification = rec.classification || "Optional";
  const strength = classificationToStrength(classification);

  // Derive risk label from recommendation text
  const riskLabel = deriveRiskLabel(rec.drugrecommendation, input.phenotype);
  const severity = deriveSeverity(riskLabel, classification);

  // Evidence-based confidence
  const confidenceFactors: ConfidenceFactors = {
    cpicClassification: classification,
    variantCount: input.variantCount,
    diplotypeExactMatch: input.diplotypeExactMatch,
    starAlleleResolved: true,
  };
  const confidence = calculateConfidence(confidenceFactors);

  // Extract implications text
  const implications = rec.implications
    ? Object.values(rec.implications).join("; ")
    : "";

  return {
    risk_label: riskLabel,
    severity,
    confidence_score: confidence,
    primary_gene: input.gene,
    recommendation: rec.drugrecommendation,
    dose_adjustment: deriveDoseAdjustment(rec.drugrecommendation, riskLabel),
    alternative_drugs: rec.alternatedrugavailable
      ? ["Consult CPIC guideline for alternatives"]
      : [],
    monitoring_required: severity !== "none",
    cpic_strength: strength,
    cpic_raw_recommendation: rec.drugrecommendation,
    cpic_classification: classification,
    cpic_implications: implications,
  };
}

// ─── Risk Derivation ────────────────────────────────────────────

function deriveRiskLabel(recommendation: string, phenotype: Phenotype): RiskLabel {
  const lower = recommendation.toLowerCase();

  // Toxic / Contraindicated patterns
  if (
    lower.includes("contraindicated") ||
    lower.includes("not recommended") ||
    lower.includes("avoid") ||
    lower.includes("toxicity") ||
    lower.includes("serious toxicity")
  ) {
    // Distinguish between toxic (too much effect) and ineffective (too little)
    if (phenotype === "PM" || lower.includes("ineffective") || lower.includes("reduced")) {
      return "Ineffective";
    }
    if (phenotype === "URM" || phenotype === "RM") {
      return "Toxic";
    }
    return "Toxic";
  }

  // Dose adjustment patterns
  if (
    lower.includes("reduce") ||
    lower.includes("decrease") ||
    lower.includes("lower") ||
    lower.includes("adjust") ||
    lower.includes("caution") ||
    lower.includes("consider")
  ) {
    return "Adjust Dosage";
  }

  // Safe patterns
  if (
    lower.includes("standard") ||
    lower.includes("per standard") ||
    lower.includes("no reason to") ||
    lower.includes("use label")
  ) {
    return "Safe";
  }

  return "Unknown";
}

function deriveSeverity(riskLabel: RiskLabel, classification: string): Severity {
  const isStrong = classification.toLowerCase() === "strong";

  switch (riskLabel) {
    case "Toxic":
      return isStrong ? "critical" : "high";
    case "Ineffective":
      return isStrong ? "high" : "moderate";
    case "Adjust Dosage":
      return isStrong ? "moderate" : "low";
    case "Safe":
      return "none";
    default:
      return "low";
  }
}

function deriveDoseAdjustment(recommendation: string, riskLabel: RiskLabel): string {
  if (riskLabel === "Safe") return "None required";

  const lower = recommendation.toLowerCase();
  if (lower.includes("contraindicated") || lower.includes("not recommended") || lower.includes("avoid")) {
    return "CONTRAINDICATED — Do not use";
  }
  if (lower.includes("reduce")) return "Reduce dose per CPIC guideline";
  if (lower.includes("increase")) return "Increase dose per CPIC guideline";
  if (lower.includes("consider")) return "Consider alternative per CPIC guideline";
  return "Consult CPIC guideline";
}

// ─── Unknown Drug Fallback ──────────────────────────────────────

function unknownDrugResult(
  drug: string,
  gene: string,
  variantCount: number,
  diplotypeExactMatch: boolean
): RiskResult {
  return {
    risk_label: "Unknown",
    severity: "low",
    confidence_score: calculateConfidence({
      cpicClassification: "Optional",
      variantCount,
      diplotypeExactMatch,
      starAlleleResolved: true,
    }),
    primary_gene: gene || "Unknown",
    recommendation: `${drug} is not in the current CPIC guideline database. Consult a clinical pharmacist for guidance.`,
    dose_adjustment: "Unknown",
    alternative_drugs: [],
    monitoring_required: true,
    cpic_strength: "optional",
    cpic_raw_recommendation: "",
    cpic_classification: "Optional",
    cpic_implications: "",
  };
}
