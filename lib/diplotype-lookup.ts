import cpicData from "../data/cpic-diplotypes.json";

export interface DiplotypeResult {
  diplotype: string;
  phenotype: "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
  confidence: number;
}

type VariantInput = { gene: string; star_allele: string; gt: string };

export function resolveDiplotype(
  gene: string,
  variants: VariantInput[]
): DiplotypeResult {
  const geneVariants = variants.filter((v) => v.gene === gene);

  if (geneVariants.length === 0) {
    return { diplotype: "*1/*1", phenotype: "NM", confidence: 0.7 };
  }

  // Collect star alleles from variants — respect zygosity from GT field
  const starAlleles: string[] = [];
  for (const v of geneVariants) {
    const alleles = v.gt.replace("|", "/").split("/");
    const altCount = alleles.filter((a) => a !== "0").length;

    if (altCount === 2) {
      // GT = 1/1 → HOMOZYGOUS ALT → both alleles carry the variant
      starAlleles.push(v.star_allele);
      starAlleles.push(v.star_allele);
    } else if (altCount === 1) {
      // GT = 0/1 → HETEROZYGOUS → one allele carries the variant
      starAlleles.push(v.star_allele);
    }
    // GT = 0/0 → no alt alleles → skip (already filtered by vcf-parser)
  }

  if (starAlleles.length === 0) {
    return { diplotype: "*1/*1", phenotype: "NM", confidence: 0.85 };
  }

  // Build diplotype string
  const wildtype = "*1";
  const diplotype =
    starAlleles.length >= 2
      ? `${starAlleles[0]}/${starAlleles[1]}`
      : `${wildtype}/${starAlleles[0]}`;

  const geneTable = (cpicData as Record<string, Record<string, { phenotype: string }>>)[gene];
  if (!geneTable) {
    return { diplotype, phenotype: "Unknown", confidence: 0.5 };
  }

  // Direct lookup
  if (geneTable[diplotype]) {
    return {
      diplotype,
      phenotype: geneTable[diplotype].phenotype as "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown",
      confidence: 0.92,
    };
  }

  // Try reversed
  const parts = diplotype.split("/");
  const reversed = `${parts[1]}/${parts[0]}`;
  if (geneTable[reversed]) {
    return {
      diplotype: reversed,
      phenotype: geneTable[reversed].phenotype as "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown",
      confidence: 0.90,
    };
  }

  // Infer from worst-function allele
  if (
    starAlleles.some(
      (a) =>
        a.includes("*2A") ||
        a.includes("*3A") ||
        a.includes("*5") ||
        a.includes("*4")
    )
  ) {
    return { diplotype, phenotype: "IM", confidence: 0.70 };
  }

  return { diplotype, phenotype: "Unknown", confidence: 0.5 };
}
