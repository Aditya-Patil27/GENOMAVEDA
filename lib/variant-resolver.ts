/**
 * Variant Resolver — rsID → Star Allele Mapping
 *
 * Curated lookup table of pharmacogenomically significant rsIDs and their
 * star allele assignments. Data sourced from CPIC and PharmVar published
 * translation tables.
 *
 * Why not live PharmVar API: PharmVar requires institutional credentials.
 * This table covers the clinically actionable variants for the 6 core PGx genes.
 */

// ─── rsID → Star Allele Mapping Table ───────────────────────────
// Format: "rsID:GENE" → "*allele"
// Sources: CPIC translation tables (cpicpgx.org), PharmVar (pharmvar.org)

const RSID_STAR_MAP: Record<string, string> = {
  // ── CYP2D6 ──
  "rs3892097:CYP2D6": "*4",       // Splicing defect → no function
  "rs5030655:CYP2D6": "*6",       // Frameshift → no function
  "rs16947:CYP2D6": "*2",         // Normal/increased function
  "rs1065852:CYP2D6": "*10",      // Decreased function (common in East Asian)
  "rs28371725:CYP2D6": "*41",     // Decreased function
  "rs1135840:CYP2D6": "*2",       // Normal function variant
  "rs5030656:CYP2D6": "*9",       // Decreased function
  "rs35742686:CYP2D6": "*3",      // Frameshift → no function
  "rs5030862:CYP2D6": "*8",       // No function (stop codon)
  "rs28371706:CYP2D6": "*17",     // Decreased function (common in African)

  // ── CYP2C19 ──
  "rs4244285:CYP2C19": "*2",      // Splicing defect → no function
  "rs4986893:CYP2C19": "*3",      // Premature stop → no function
  "rs12248560:CYP2C19": "*17",    // Increased function (promoter variant)
  "rs28399504:CYP2C19": "*4",     // No function
  "rs56337013:CYP2C19": "*5",     // No function
  "rs72552267:CYP2C19": "*6",     // No function
  "rs72558186:CYP2C19": "*7",     // No function
  "rs41291556:CYP2C19": "*8",     // No function

  // ── CYP2C9 ──
  "rs1799853:CYP2C9": "*2",       // Decreased function
  "rs1057910:CYP2C9": "*3",       // Decreased function
  "rs28371686:CYP2C9": "*5",      // Decreased function
  "rs9332131:CYP2C9": "*6",       // No function
  "rs56165452:CYP2C9": "*8",      // Decreased function
  "rs28371685:CYP2C9": "*11",     // Decreased function

  // ── SLCO1B1 ──
  "rs4149056:SLCO1B1": "*5",      // Decreased function (Val174Ala)
  "rs2306283:SLCO1B1": "*1b",     // Increased function
  "rs4149015:SLCO1B1": "*1a",     // Reference/normal function
  "rs11045819:SLCO1B1": "*14",    // Decreased function

  // ── TPMT ──
  "rs1800462:TPMT": "*2",         // No function
  "rs1800460:TPMT": "*3B",        // No function
  "rs1142345:TPMT": "*3C",        // No function
  // *3A = *3B + *3C combined (both rs1800460 + rs1142345)

  // ── DPYD ──
  "rs3918290:DPYD": "*2A",        // No function (IVS14+1G>A splice)
  "rs55886062:DPYD": "*13",       // No function
  "rs67376798:DPYD": "c.2846A>T", // Decreased function
  "rs75017182:DPYD": "c.1129-5923C>G", // Decreased function (HapB3)
  "rs56038477:DPYD": "c.1236G>A", // Decreased function (HapB3 tag SNP)
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Resolve an rsID to its star allele for a specific gene.
 * Returns the star allele string (e.g., "*4") or "unknown" if not found.
 */
export function resolveRsidToStar(rsid: string, gene: string): string {
  const key = `${rsid}:${gene}`;
  return RSID_STAR_MAP[key] ?? "unknown";
}

/**
 * Check whether a given rsID is in a pharmacogenomically relevant gene.
 * Useful for filtering VCF variants before attempting resolution.
 */
export function isPharmacogenomicRsid(rsid: string): boolean {
  return Object.keys(RSID_STAR_MAP).some((key) => key.startsWith(`${rsid}:`));
}

/**
 * Get all known rsIDs for a specific gene.
 */
export function getKnownRsidsForGene(gene: string): string[] {
  return Object.keys(RSID_STAR_MAP)
    .filter((key) => key.endsWith(`:${gene}`))
    .map((key) => key.split(":")[0]);
}

/**
 * Get the full lookup table (for diagnostic/audit purposes).
 */
export function getVariantTable(): Record<string, string> {
  return { ...RSID_STAR_MAP };
}

/**
 * Count of known variants in the resolver table.
 */
export function getVariantCount(): number {
  return Object.keys(RSID_STAR_MAP).length;
}
