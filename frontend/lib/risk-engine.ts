import { getDrugRecommendations, classificationToStrength, CpicRecommendation } from "./cpic-client";
import { getDrugInfo } from "./drug-registry";
import { calculateConfidence, ConfidenceFactors } from "./confidence-calculator";
import { PharmaConfidenceScorer } from "./confidence-scorer";

type Phenotype = "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
type Severity = "none" | "low" | "moderate" | "high" | "critical";
type FunctionClass = "Normal Function" | "Decreased Function" | "Poor Function";
type PhenotypeKey = Phenotype | FunctionClass;

interface DrugRule {
  risk: string;
  severity: string;
  recommendation: string;
}

type DrugRules = { gene: string } & Partial<Record<PhenotypeKey, DrugRule>>;
type CpicDictionary = Record<string, DrugRules>;

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
  cpic_raw_recommendation: string;
  cpic_classification: string;
  cpic_implications: string;
  data_source?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
/** Confidence penalty when diplotype is inferred (unphased, contains "/") */
const INFERRED_DIPLOTYPE_CONFIDENCE = 0.92;
/** Assumed read-depth ratio when only GQ is available */
const GQ_TO_DP_RATIO = 0.7;
/** Minimum assumed read depth */
const MIN_READ_DEPTH = 30;

// ─── Phenotype Mapping ────────────────────────────────────────────────────────
const PHENOTYPE_CPIC_NAMES: Record<Phenotype, string[]> = {
  PM: ["Poor Metabolizer", "poor metabolizer"],
  IM: ["Intermediate Metabolizer", "intermediate metabolizer"],
  NM: ["Normal Metabolizer", "normal metabolizer", "Extensive Metabolizer"],
  RM: ["Rapid Metabolizer", "rapid metabolizer"],
  URM: ["Ultrarapid Metabolizer", "ultrarapid metabolizer", "Ultra-rapid Metabolizer"],
  Unknown: ["Unknown", "Indeterminate"],
};

// ─── Offline Core Dictionary (6-drug guaranteed fallback) ─────────────────────
const CPIC_DICTIONARY = Object.freeze({
  "CODEINE": Object.freeze({
    "gene": "CYP2D6",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Use codeine label recommended age- or weight-specific dosing." }),
    "IM": Object.freeze({ risk: "Adjust Dosage", severity: "low", recommendation: "Use codeine label recommended dosing. Monitor closely for lack of efficacy." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "high", recommendation: "Avoid codeine due to lack of efficacy. Use alternative analgesic." }),
    "URM": Object.freeze({ risk: "Toxic", severity: "critical", recommendation: "Avoid codeine due to high risk of severe toxicity." })
  }),
  "CLOPIDOGREL": Object.freeze({
    "gene": "CYP2C19",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Standard dosing of clopidogrel." }),
    "IM": Object.freeze({ risk: "Toxic", severity: "high", recommendation: "Avoid standard dose clopidogrel. Use prasugrel or ticagrelor." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "critical", recommendation: "Avoid clopidogrel. Use prasugrel or ticagrelor." })
  }),
  "WARFARIN": Object.freeze({
    "gene": "CYP2C9",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Initiate therapy with standard dose based on clinical factors." }),
    "IM": Object.freeze({ risk: "Adjust Dosage", severity: "moderate", recommendation: "Consider initial dose reduction (15-30% lower). Monitor INR closely." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "high", recommendation: "Significant dose reduction required (50%+ lower). Monitor INR very closely." })
  }),
  "SIMVASTATIN": Object.freeze({
    "gene": "SLCO1B1",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Prescribe desired starting dose." }),
    "Normal Function": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Prescribe desired starting dose." }),
    "IM": Object.freeze({ risk: "Adjust Dosage", severity: "moderate", recommendation: "Prescribe lower dose or alternative statin. Max 20mg/day." }),
    "Decreased Function": Object.freeze({ risk: "Adjust Dosage", severity: "moderate", recommendation: "Prescribe lower dose or alternative statin. Max 20mg/day." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "high", recommendation: "Avoid simvastatin due to myopathy risk. Use alternative." }),
    "Poor Function": Object.freeze({ risk: "Toxic", severity: "high", recommendation: "Avoid simvastatin due to myopathy risk. Use alternative." })
  }),
  "AZATHIOPRINE": Object.freeze({
    "gene": "TPMT",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Start with standard dosing." }),
    "IM": Object.freeze({ risk: "Adjust Dosage", severity: "moderate", recommendation: "Start with reduced dose (30-70% of standard). Monitor myelosuppression." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "critical", recommendation: "Avoid azathioprine. Use alternative agent." })
  }),
  "FLUOROURACIL": Object.freeze({
    "gene": "DPYD",
    "NM": Object.freeze({ risk: "Safe", severity: "none", recommendation: "Use label recommended dosage." }),
    "IM": Object.freeze({ risk: "Adjust Dosage", severity: "high", recommendation: "Reduce starting dose by 50%. Monitor for toxicity." }),
    "PM": Object.freeze({ risk: "Toxic", severity: "critical", recommendation: "Avoid fluorouracil. Use alternative drug." })
  })
}) satisfies CpicDictionary;

// ─── Singleton scorer (avoid per-call instantiation) ─────────────────────────
const confidenceScorer = new PharmaConfidenceScorer();

// ─── Phenotype Mapping Logic ──────────────────────────────────────────────────
const mapPhenotype = (gene: string, diplotype: string): PhenotypeKey => {
  if (gene === "CYP2D6") {
    if (["*1/*1xN", "*1/*2xN", "*2/*2xN", "*1xN", "*2xN"].some(d => diplotype.includes(d) || diplotype.includes("x"))) return "URM";
    if (["*1/*1", "*1/*2", "*2/*2"].some(d => diplotype.includes(d))) return "NM";
    if (["*1/*3", "*1/*4", "*1/*5", "*2/*4", "*2/*5"].some(d => diplotype.includes(d))) return "IM";
    if (["*3/*4", "*4/*4", "*3/*3", "*4/*5", "*5/*5"].some(d => diplotype.includes(d))) return "PM";
  } else if (gene === "CYP2C19" || gene === "CYP2C9") {
    if (["*1/*1"].some(d => diplotype.includes(d))) return "NM";
    if (["*1/*2", "*1/*3"].some(d => diplotype.includes(d))) return "IM";
    if (["*2/*2", "*2/*3", "*3/*3"].some(d => diplotype.includes(d))) return "PM";
  } else if (gene === "SLCO1B1") {
    if (["*1/*1"].some(d => diplotype.includes(d))) return "Normal Function";
    if (["*1/*5"].some(d => diplotype.includes(d))) return "Decreased Function";
    if (["*5/*5"].some(d => diplotype.includes(d))) return "Poor Function";
  } else if (gene === "TPMT" || gene === "DPYD") {
    if (["*1/*1"].some(d => diplotype.includes(d))) return "NM";
    if (["*1/*2", "*1/*3", "*1/*3A", "*1/*3C", "*1/*4"].some(d => diplotype.includes(d))) return "IM";
    if (["*2/*2", "*3/*3", "*3A/*3A", "*2/*3", "*3A/*3C"].some(d => diplotype.includes(d))) return "PM";
  }
  return "Unknown" as Phenotype;
};

// ─── Offline Risk Evaluation ──────────────────────────────────────────────────
function evaluateRiskOffline(drug: string, gene: string, diplotype: string): Partial<RiskResult> | null {
  const cleanDrug = String(drug).trim().toUpperCase();
  const cleanGene = String(gene).trim().toUpperCase();
  const cleanDiplotype = String(diplotype).trim();

  const mappedPhenotype = mapPhenotype(cleanGene, cleanDiplotype);
  const drugRules: DrugRules | undefined = (CPIC_DICTIONARY as CpicDictionary)[cleanDrug];

  const confidence = cleanDiplotype.includes("/") ? INFERRED_DIPLOTYPE_CONFIDENCE : 1.0;

  if (drugRules && drugRules[mappedPhenotype]) {
    const match = drugRules[mappedPhenotype]!;
    return {
      risk_label: match.risk as RiskLabel,
      severity: match.severity as Severity,
      recommendation: match.recommendation,
      cpic_raw_recommendation: match.recommendation,
      cpic_strength: "strong",
      dose_adjustment: match.risk === "Safe" ? "None required" : "See recommendation",
      alternative_drugs: [],
      monitoring_required: match.severity !== "none",
      cpic_classification: "Strong",
      cpic_implications: "Derived from CPIC Clinical Guideline (Offline Core)",
      data_source: "CPIC v1.9 (Offline Core)",
      confidence_score: confidence,
    };
  }
  return null;
}

// ─── Main Risk Assessment ─────────────────────────────────────────────────────
export async function assessRisk(
  drug: string,
  phenotype: Phenotype,
  gene: string,
  variantCount: number = 0,
  diplotypeExactMatch: boolean = true,
  diplotype: string = "",
  minGQ: number = 60
): Promise<RiskResult> {
  const drugUpper = drug.toUpperCase().trim();

  // 1. Try Offline Core FIRST — short-circuits before any network I/O
  const offlineResult = evaluateRiskOffline(drugUpper, gene, diplotype);

  // 2. Build confidence evidence object
  const clampedGQ = Math.max(0, Math.min(minGQ, 99));
  const evidence = {
    vcf: {
      genotypeQuality: clampedGQ,
      readDepth: clampedGQ > 0 ? Math.max(MIN_READ_DEPTH, Math.round(clampedGQ * GQ_TO_DP_RATIO)) : MIN_READ_DEPTH,
      phasing: diplotype.includes("/") ? "none" : "phased",
      variants: variantCount > 0 ? [{ alleleFrequency: 0.1 }] : [],
    },
    diplotype: {
      matchType: diplotypeExactMatch ? "exact" : (diplotype.includes("/") ? "inferred" : "partial"),
    },
    cpic: {
      dataSource: offlineResult?.data_source ?? "fallback_cache",
      classification: "Strong",
    },
    gene,
    variants: [],
  };

  const confidenceResult = confidenceScorer.score(evidence);

  if (offlineResult) {
    return {
      ...offlineResult,
      confidence_score: confidenceResult.score,
      primary_gene: gene,
      cpic_implications: "CPIC v1.9 (Offline Core) - Validated Match",
      data_source: "CPIC v1.9 (Offline Core)",
      risk_label: offlineResult.risk_label!,
      severity: offlineResult.severity!,
      recommendation: offlineResult.recommendation!,
      dose_adjustment: offlineResult.dose_adjustment!,
      alternative_drugs: offlineResult.alternative_drugs!,
      monitoring_required: offlineResult.monitoring_required!,
      cpic_strength: offlineResult.cpic_strength!,
      cpic_raw_recommendation: offlineResult.cpic_raw_recommendation!,
      cpic_classification: offlineResult.cpic_classification!,
    } as RiskResult;
  }

  // 3. Online path: look up drug in registry then fetch CPIC recommendations
  const drugInfo = await getDrugInfo(drugUpper);

  if (!drugInfo?.drugId) {
    return unknownDrugResult(drugUpper, gene, variantCount, diplotypeExactMatch);
  }

  const recommendations = await getDrugRecommendations(drugInfo.drugId);

  if (!recommendations || recommendations.length === 0) {
    return unknownDrugResult(drugUpper, gene, variantCount, diplotypeExactMatch);
  }

  const matchingRec = findMatchingRecommendation(recommendations, phenotype, gene);

  if (!matchingRec) {
    return buildResult({
      drug: drugUpper,
      gene: drugInfo.gene ?? gene,
      phenotype,
      recommendation: recommendations[0],
      isFallback: true,
      variantCount,
      diplotypeExactMatch,
      minGQ: clampedGQ,
    });
  }

  return buildResult({
    drug: drugUpper,
    gene: drugInfo.gene ?? gene,
    phenotype,
    recommendation: matchingRec,
    isFallback: false,
    variantCount,
    diplotypeExactMatch,
    minGQ: clampedGQ,
  });
}

// ─── Recommendation Matching ──────────────────────────────────────────────────
function findMatchingRecommendation(
  recommendations: CpicRecommendation[],
  phenotype: Phenotype,
  gene: string
): CpicRecommendation | null {
  const phenotypeNames = PHENOTYPE_CPIC_NAMES[phenotype] ?? [];

  for (const rec of recommendations) {
    if (rec.phenotypes?.[gene]) {
      const recPhenotype = rec.phenotypes[gene].toLowerCase();
      if (phenotypeNames.some((p) => recPhenotype.includes(p.toLowerCase()))) return rec;
    }
  }

  for (const rec of recommendations) {
    if (rec.lookupkey?.[gene]) {
      const lookupVal = rec.lookupkey[gene].toLowerCase();
      if (phenotypeNames.some((p) => lookupVal.includes(p.toLowerCase()))) return rec;
    }
  }

  return null;
}

// ─── Result Building ──────────────────────────────────────────────────────────
interface BuildResultInput {
  drug: string;
  gene: string;
  phenotype: Phenotype;
  recommendation: CpicRecommendation;
  isFallback: boolean;
  variantCount: number;
  diplotypeExactMatch: boolean;
  minGQ: number;
}

function buildResult(input: BuildResultInput): RiskResult {
  const rec = input.recommendation;
  const classification = rec.classification ?? "Optional";
  const strength = classificationToStrength(classification);
  const riskLabel = deriveRiskLabel(rec.drugrecommendation, input.phenotype);
  const severity = deriveSeverity(riskLabel, classification);

  const confidenceFactors: ConfidenceFactors = {
    cpicClassification: classification,
    variantCount: input.variantCount,
    diplotypeExactMatch: input.diplotypeExactMatch,
    starAlleleResolved: true,
    minGQ: input.minGQ,
  };
  const confidence = calculateConfidence(confidenceFactors);

  const implications = rec.implications ? Object.values(rec.implications).join("; ") : "";

  return {
    risk_label: riskLabel,
    severity,
    confidence_score: confidence,
    primary_gene: input.gene,
    recommendation: rec.drugrecommendation,
    dose_adjustment: deriveDoseAdjustment(rec.drugrecommendation, riskLabel),
    alternative_drugs: rec.alternatedrugavailable ? ["Consult CPIC guideline for alternatives"] : [],
    monitoring_required: severity !== "none",
    cpic_strength: strength,
    cpic_raw_recommendation: rec.drugrecommendation,
    cpic_classification: classification,
    cpic_implications: implications,
    data_source: "CPIC API (Live)",
  };
}

// ─── Risk Derivation ──────────────────────────────────────────────────────────
function deriveRiskLabel(recommendation: string, phenotype: Phenotype): RiskLabel {
  const lower = recommendation.toLowerCase();

  if (
    lower.includes("contraindicated") ||
    lower.includes("not recommended") ||
    lower.includes("avoid") ||
    lower.includes("toxicity") ||
    lower.includes("serious toxicity")
  ) {
    if (phenotype === "PM" || lower.includes("ineffective") || lower.includes("reduced")) return "Ineffective";
    return "Toxic";
  }

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
    case "Toxic":      return isStrong ? "critical" : "high";
    case "Ineffective": return isStrong ? "high" : "moderate";
    case "Adjust Dosage": return isStrong ? "moderate" : "low";
    case "Safe":       return "none";
    default:           return "low";
  }
}

function deriveDoseAdjustment(recommendation: string, riskLabel: RiskLabel): string {
  if (riskLabel === "Safe") return "None required";
  const lower = recommendation.toLowerCase();
  if (lower.includes("contraindicated") || lower.includes("not recommended") || lower.includes("avoid")) return "CONTRAINDICATED — Do not use";
  if (lower.includes("reduce")) return "Reduce dose per CPIC guideline";
  if (lower.includes("increase")) return "Increase dose per CPIC guideline";
  if (lower.includes("consider")) return "Consider alternative per CPIC guideline";
  return "Consult CPIC guideline";
}

// ─── Unknown Drug Fallback ────────────────────────────────────────────────────
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
    dose_adjustment: "Unknown — consult pharmacist",
    alternative_drugs: [],
    monitoring_required: true,
    cpic_strength: "optional",
    cpic_raw_recommendation: "",
    cpic_classification: "Optional",
    cpic_implications: "",
  };
}
