import { resolveRsidToStar } from "./variant-resolver";

export interface ParsedVariant {
  rsid: string;
  gene: string;
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  zygosity: "homozygous" | "heterozygous" | "hemizygous";
  star_allele: string;
  clinical_significance: string;
  gt: string;
}

export interface ParsedVCF {
  variants: ParsedVariant[];
  warnings: string[];
  success: boolean;
}

const TARGET_GENES = new Set(["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]);

export function parseVCF(content: string): ParsedVCF {
  const warnings: string[] = [];
  const variants: ParsedVariant[] = [];

  try {
    if (!content || content.trim().length === 0) {
      return { variants: [], warnings: ["Empty VCF file"], success: false };
    }

    const lines = content.split(/\r?\n/);
    let hasHeader = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      // Skip meta-information lines
      if (line.startsWith("##")) continue;

      // Header line
      if (line.startsWith("#CHROM")) {
        hasHeader = true;
        continue;
      }

      // Skip any other comment lines
      if (line.startsWith("#")) continue;

      // Data lines
      const cols = line.split("\t");
      if (cols.length < 8) {
        warnings.push(`Line ${i + 1}: insufficient columns (${cols.length})`);
        continue;
      }

      const [chrom, pos, id, ref, alt, , , info, format, sample] = cols;

      // Parse INFO field
      const infoMap: Record<string, string> = {};
      if (!info || info === ".") {
        warnings.push(`Line ${i + 1}: Missing INFO field`);
        continue;
      }

      info.split(";").forEach((pair) => {
        const eqIdx = pair.indexOf("=");
        if (eqIdx > 0) {
          infoMap[pair.substring(0, eqIdx)] = pair.substring(eqIdx + 1);
        }
      });

      const gene = infoMap["GENE"];
      if (!gene || !TARGET_GENES.has(gene)) continue;

      // Parse GT field
      const gtIndex = format ? format.split(":").indexOf("GT") : 0;
      const sampleFields = sample ? sample.split(":") : [];
      const gt = sampleFields[gtIndex >= 0 ? gtIndex : 0] || "0/0";

      // Determine zygosity
      const alleles = gt.replace("|", "/").split("/");
      let zygosity: "homozygous" | "heterozygous" | "hemizygous" = "heterozygous";
      if (alleles.length === 1) {
        zygosity = "hemizygous";
      } else if (alleles[0] === alleles[1]) {
        zygosity = "homozygous";
      }

      // Only include variants with alt allele called
      if (!alleles.includes("1") && !alleles.includes("2")) continue;

      const rsid = infoMap["RS"] || id || "rs_unknown";
      // Dynamic star allele resolution: prefer STAR= tag, fallback to rsID lookup
      let starAllele = infoMap["STAR"] || "";
      if (!starAllele && rsid && rsid !== "rs_unknown") {
        starAllele = resolveRsidToStar(rsid, gene);
      }
      if (!starAllele) starAllele = "unknown";

      variants.push({
        rsid,
        gene,
        chromosome: chrom,
        position: parseInt(pos) || 0,
        ref_allele: ref,
        alt_allele: alt,
        zygosity,
        star_allele: starAllele,
        clinical_significance: starAllele !== "unknown" ? `${starAllele} variant in ${gene}` : `Variant at ${rsid} in ${gene}`,
        gt,
      });
    }

    if (!hasHeader) {
      warnings.push("No #CHROM header line found — file may not be valid VCF v4.2");
    }

    if (variants.length === 0) {
      warnings.push("No pharmacogenomic variants detected in target genes");
    }

    return { variants, warnings, success: true };
  } catch (error) {
    return {
      variants: [],
      warnings: [`VCF parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      success: false,
    };
  }
}
