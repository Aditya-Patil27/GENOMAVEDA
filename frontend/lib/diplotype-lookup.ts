import { getDiplotypeMappings } from "./cpic-client";
import { resolveRsidToStar } from "./variant-resolver";
import { calculateConfidence, calculateFallbackConfidence, ConfidenceFactors } from "./confidence-calculator";

export interface DiplotypeResult {
  diplotype: string;
  phenotype: "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
  confidence: number;
  /** Whether the diplotype was an exact match in CPIC database */
  exactMatch: boolean;
  /** Whether star alleles were resolved from rsIDs (vs STAR= tag) */
  resolvedFromRsid: boolean;
  /** CPIC consultation text for this diplotype */
  consultationText: string;
}

type VariantInput = { gene: string; star_allele: string; gt: string; rsid?: string };

/**
 * Resolve a diplotype for a given gene from variant data.
 * Now async — pulls diplotype→phenotype mappings from the live CPIC API.
 * Falls back to local inference if the API is unreachable.
 */
export async function resolveDiplotype(
  gene: string,
  variants: VariantInput[],
  cpicClassification?: string
): Promise<DiplotypeResult> {
  const geneVariants = variants.filter((v) => v.gene === gene);

  if (geneVariants.length === 0) {
    return {
      diplotype: "*1/*1",
      phenotype: "NM",
      confidence: calculateFallbackConfidence(0, false),
      exactMatch: false,
      resolvedFromRsid: false,
      consultationText: "",
    };
  }

  // ─── Collect star alleles from variants ──────────────────────
  let resolvedFromRsid = false;
  const starAlleles: string[] = [];

  for (const v of geneVariants) {
    let starAllele = v.star_allele;

    // If star_allele is unknown, try resolving from rsID
    if ((!starAllele || starAllele === "unknown") && v.rsid) {
      const resolved = resolveRsidToStar(v.rsid, gene);
      if (resolved !== "unknown") {
        starAllele = resolved;
        resolvedFromRsid = true;
      }
    }

    if (!starAllele || starAllele === "unknown") continue;

    // Respect zygosity from GT field
    const alleles = v.gt.replace("|", "/").split("/");
    const altCount = alleles.filter((a) => a !== "0").length;

    if (altCount === 2) {
      // GT = 1/1 → HOMOZYGOUS ALT → both alleles carry the variant
      starAlleles.push(starAllele);
      starAlleles.push(starAllele);
    } else if (altCount === 1) {
      // GT = 0/1 → HETEROZYGOUS → one allele carries the variant
      starAlleles.push(starAllele);
    }
  }

  if (starAlleles.length === 0) {
    return {
      diplotype: "*1/*1",
      phenotype: "NM",
      confidence: calculateFallbackConfidence(geneVariants.length, false),
      exactMatch: false,
      resolvedFromRsid,
      consultationText: "",
    };
  }

  // Build diplotype string
  const wildtype = "*1";
  const diplotype =
    starAlleles.length >= 2
      ? `${starAlleles[0]}/${starAlleles[1]}`
      : `${wildtype}/${starAlleles[0]}`;

  // ─── Look up in CPIC API ─────────────────────────────────────
  const cpicMappings = await getDiplotypeMappings(gene);

  // Try direct match
  let match = cpicMappings.get(diplotype);
  let exactMatch = !!match;

  // Try reversed order
  if (!match) {
    const parts = diplotype.split("/");
    const reversed = `${parts[1]}/${parts[0]}`;
    match = cpicMappings.get(reversed);
    exactMatch = !!match;
  }

  if (match) {
    const phenotype = match.phenotype as "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
    const confidenceFactors: ConfidenceFactors = {
      cpicClassification: cpicClassification || "Strong",
      variantCount: geneVariants.length,
      diplotypeExactMatch: true,
      starAlleleResolved: !resolvedFromRsid,
    };

    return {
      diplotype,
      phenotype,
      confidence: calculateConfidence(confidenceFactors),
      exactMatch: true,
      resolvedFromRsid,
      consultationText: match.consultationText,
    };
  }

  // ─── Fallback: infer from allele function ────────────────────
  const inferredPhenotype = inferPhenotypeFromAlleles(starAlleles);
  const confidenceFactors: ConfidenceFactors = {
    cpicClassification: cpicClassification || "Moderate",
    variantCount: geneVariants.length,
    diplotypeExactMatch: false,
    starAlleleResolved: !resolvedFromRsid,
  };

  return {
    diplotype,
    phenotype: inferredPhenotype,
    confidence: calculateConfidence(confidenceFactors),
    exactMatch: false,
    resolvedFromRsid,
    consultationText: "",
  };
}

/**
 * Infer metabolizer phenotype from star allele patterns when CPIC lookup fails.
 */
function inferPhenotypeFromAlleles(
  starAlleles: string[]
): "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown" {
  const noFunction = ["*3", "*4", "*5", "*6", "*7", "*8", "*2A", "*3A", "*3B"];
  const decreasedFunction = ["*2", "*9", "*10", "*17", "*41", "*3C", "c.2846A>T"];
  const increasedFunction = ["*17", "*1x2", "*2x2"];

  const hasNoFunction = starAlleles.some((a) =>
    noFunction.some((nf) => a.includes(nf))
  );
  const hasDecreased = starAlleles.some((a) =>
    decreasedFunction.some((df) => a.includes(df))
  );
  const hasIncreased = starAlleles.some((a) =>
    increasedFunction.some((inf) => a.includes(inf))
  );

  // Both alleles non-functional
  if (
    hasNoFunction &&
    starAlleles.filter((a) => noFunction.some((nf) => a.includes(nf))).length >= 2
  ) {
    return "PM";
  }

  // One non-functional
  if (hasNoFunction) return "IM";

  // Increased function
  if (hasIncreased && !hasDecreased) return "RM";

  // Decreased function
  if (hasDecreased) return "IM";

  return "Unknown";
}
