import { resolveRsidToStar, getGeneForRsid } from "./variant-resolver";

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
  gq: number; // Genotype Quality
  dp: number; // Read Depth
}

export interface ParsedVCF {
  variants: ParsedVariant[];
  warnings: string[];
  success: boolean;
  genes_missing?: string[];
  is_23andme?: boolean;
}

const TARGET_GENES = new Set(["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]);

export function parseVCF(content: string): ParsedVCF {
  const warnings: string[] = [];
  const variants: ParsedVariant[] = [];

  try {
    if (!content || content.trim().length === 0) {
      return { variants: [], warnings: ["Empty file"], success: false };
    }

    const lines = content.split(/\r?\n/);
    let hasHeader = false;
    const is23andMe = content.includes("23andMe") || content.match(/^#?\s*rsid\s+chromosome\s+position\s+genotype/i) !== null;

    if (is23andMe) {
      warnings.push("Detected 23andMe / Consumer DNA format.");
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim() || line.startsWith("#")) continue;

        // 23andMe is tab separated: rsid chromosome position genotype
        const cols = line.split(/\t/);
        if (cols.length < 4) continue;

        const [rsid, chrom, posStr, genotype] = cols;
        const pos = parseInt(posStr, 10) || 0;

        // Consumer formats don't specify the gene in the row; lookup required
        const gene = getGeneForRsid(rsid);
        if (!gene || !TARGET_GENES.has(gene)) continue;
        
        // Skip uncalled variants
        if (genotype === "--" || genotype === "__" || !genotype) continue;

        const alleles = genotype.split("");
        let zygosity: "homozygous" | "heterozygous" | "hemizygous" = "heterozygous";
        if (alleles.length === 1) {
          zygosity = "hemizygous";
        } else if (alleles[0] === alleles[1]) {
          zygosity = "homozygous";
        }

        const starAllele = resolveRsidToStar(rsid, gene);

        variants.push({
          rsid,
          gene,
          chromosome: chrom,
          position: pos,
          ref_allele: "N", // Consumer files don't provide REF/ALT explicitly
          alt_allele: alleles[0],
          zygosity,
          star_allele: starAllele !== "unknown" ? starAllele : "unknown",
          clinical_significance: starAllele !== "unknown" ? `${starAllele} variant in ${gene}` : `Variant at ${rsid} in ${gene}`,
          gt: alleles.join("/"),
          gq: 99, // Max certainty for consumer arrays usually
          dp: 30, // Mock read depth
        });
      }

      hasHeader = true;
    } else {
      // Standard VCF parsing
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

        // Parse GT, GQ, DP from FORMAT and SAMPLE fields
        const formatFields = format ? format.split(":") : [];
        const sampleFields = sample ? sample.split(":") : [];
        
        // Helper to safely get field value
        const getFieldVal = (key: string): string | undefined => {
          const idx = formatFields.indexOf(key);
          return idx >= 0 ? sampleFields[idx] : undefined;
        };

        const gt = getFieldVal("GT") || "0/0";
        const gqStr = getFieldVal("GQ");
        const dpStr = getFieldVal("DP");

        const gq = gqStr ? parseInt(gqStr, 10) : 0;
        const dp = dpStr ? parseInt(dpStr, 10) : 0;

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
          gq: isNaN(gq) ? 0 : gq,
          dp: isNaN(dp) ? 0 : dp
        });
      } // end VCF for loop
    } // end else block

    if (!hasHeader) {
      warnings.push("No #CHROM or rsid header found — file may not be valid");
    }

    if (variants.length === 0) {
      warnings.push("No pharmacogenomic variants detected in target genes");
    }

    const detectedGenes = new Set(variants.map(v => v.gene));
    const missingGenes = Array.from(TARGET_GENES).filter(g => !detectedGenes.has(g));

    return { variants, warnings, success: true, genes_missing: missingGenes, is_23andme: is23andMe };
  } catch (error) {
    return {
      variants: [],
      warnings: [`File parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      success: false,
    };
  }
}
