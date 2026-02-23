export interface ConfidenceFactor {
  weight: number;
  reason: string;
  raw_value?: any;
}

export interface ConfidenceBreakdown {
  vcf_quality?: ConfidenceFactor;
  diplotype_match?: ConfidenceFactor;
  cpic_data_source?: ConfidenceFactor;
  gene_complexity?: ConfidenceFactor;
  phasing_certainty?: ConfidenceFactor;
  coverage_depth?: ConfidenceFactor;
  allele_frequency?: ConfidenceFactor;
}

export interface ConfidenceResult {
  score: number;
  breakdown: ConfidenceBreakdown;
  dominant_penalty: [string, ConfidenceFactor] | undefined;
  score_class: { label: string; color: string };
}

export class PharmaConfidenceScorer {
  score(evidence: any): ConfidenceResult {
    const factors: any = {
      vcf_quality:        this.scoreVCFQuality(evidence.vcf),
      diplotype_match:    this.scoreDiplotypeMatch(evidence.diplotype),
      cpic_data_source:   this.scoreCPICSource(evidence.cpic),
      gene_complexity:    this.scoreGeneComplexity(evidence.gene),
      phasing_certainty:  this.scorePhasings(evidence.vcf),
      coverage_depth:     this.scoreCoverage(evidence.vcf),
      allele_frequency:   this.scoreAlleleFrequency(evidence.variants),
    };

    // Multiply all factors — one bad factor tanks the whole score
    const raw = Object.values(factors).reduce((acc: number, f: any) => acc * f.weight, 1.0);
    
    // Apply floor and ceiling
    const final = Math.min(0.99, Math.max(0.05, raw));

    return {
      score: Math.round(final * 100) / 100, // Keep as decimal 0.xx for consistency with app logic
      breakdown: factors,
      dominant_penalty: this.findDominantPenalty(factors),
      score_class: this.classifyScore(final)
    };
  }

  // ─── FACTOR 1: VCF Quality ───────────────────────────────────────
  scoreVCFQuality(vcf: any) {
    const gq = vcf.genotypeQuality || 0; 

    let weight;
    let reason;

    if (gq >= 99)       { weight = 1.00; reason = "GQ≥99 — high confidence call"; }
    else if (gq >= 90)  { weight = 0.92; reason = "GQ 90–98 — minor quality loss"; }
    else if (gq >= 60)  { weight = 0.75; reason = "GQ 60–89 — moderate uncertainty"; }
    else if (gq >= 30)  { weight = 0.50; reason = "GQ 30–59 — low quality call"; }
    else                { weight = 0.20; reason = "GQ<30 — unreliable genotype"; }

    return { weight, reason, raw_value: gq };
  }

  // ─── FACTOR 2: Read Depth ────────────────────────────────────────
  scoreCoverage(vcf: any) {
    const dp = vcf.readDepth || 0;

    let weight;
    let reason;

    if (dp >= 60)       { weight = 1.00; reason = "DP≥60 — adequate coverage"; }
    else if (dp >= 30)  { weight = 0.90; reason = "DP 30–59 — acceptable coverage"; }
    else if (dp >= 15)  { weight = 0.70; reason = "DP 15–29 — borderline coverage"; }
    else if (dp >= 5)   { weight = 0.45; reason = "DP 5–14 — low coverage, unreliable"; }
    else                { weight = 0.15; reason = "DP<5 — insufficient coverage"; }

    return { weight, reason, raw_value: dp };
  }

  // ─── FACTOR 3: Diplotype Match Quality ──────────────────────────
  scoreDiplotypeMatch(diplotype: any) {
    const matchTypes: any = {
      'exact':          { weight: 1.00, reason: "Direct CPIC diplotype table hit" },
      'inferred':       { weight: 0.72, reason: "Inferred from partial allele data — phase ambiguous" },
      'partial':        { weight: 0.55, reason: "One allele unresolved" },
      'default_normal': { weight: 0.60, reason: "No variant found — assumed *1 wildtype" },
      'none':           { weight: 0.20, reason: "No diplotype could be assigned" },
    };

    const match = matchTypes[diplotype.matchType] ?? { weight: 0.20, reason: "Unknown match type" };
    return { ...match, raw_value: diplotype.matchType };
  }

  // ─── FACTOR 4: CPIC Data Source ─────────────────────────────────
  scoreCPICSource(cpic: any) {
    const sources: any = {
      'live_cpic_api':      { weight: 1.00, reason: "Live CPIC API — current guidelines" },
      'offline_core_v1.9':  { weight: 0.93, reason: "Offline CPIC v1.9 — validated but static" },
      'fallback_cache':     { weight: 0.30, reason: "Fallback cache — unverified, may be stale" },
      'hardcoded':          { weight: 0.15, reason: "Hardcoded value — not from CPIC at all" },
    };

    // Also penalize if CPIC evidence level is weak
    const evidenceLevels: any = {
      'Strong':   1.00,
      'Moderate': 0.88,
      'Weak':     0.70,
      'N/A':      0.20, 
      'Optional': 0.20
    };

    // Normalize input key strictly
    const sourceKey = (cpic.dataSource || "").toLowerCase().replace(/[\s\(\)]/g, "_").replace(/_v1\.9_offline_core/, "_core_v1.9").includes("offline") ? "offline_core_v1.9" : (cpic.dataSource?.includes("API") ? "live_cpic_api" : "fallback_cache");
    const source = sources[sourceKey] || sources['fallback_cache'];
    
    const evidenceKey = cpic.classification || "N/A";
    const evidenceMultiplier = evidenceLevels[evidenceKey] ?? 0.20;

    return {
      weight: source.weight * evidenceMultiplier,
      reason: `${source.reason} × CPIC evidence: ${evidenceKey}`,
      raw_value: { source: cpic.dataSource, evidence: cpic.classification }
    };
  }

  // ─── FACTOR 5: Gene Complexity ───────────────────────────────────
  scoreGeneComplexity(gene: string) {
    const complexityPenalties: any = {
      'CYP2D6':  { weight: 0.82, reason: "High complexity — CNV and structural variants undetectable from short-read VCF" },
      'CYP2C19': { weight: 0.96, reason: "Low-moderate complexity — well characterized from SNPs" },
      'CYP2C9':  { weight: 0.96, reason: "Low-moderate complexity" },
      'DPYD':    { weight: 0.94, reason: "Moderate — key variants well covered in standard panels" },
      'TPMT':    { weight: 0.97, reason: "Low complexity — SNP-based calling highly accurate" },
      'SLCO1B1': { weight: 0.97, reason: "Low complexity — single key variant (rs4149056)" },
    };

    return complexityPenalties[gene] 
      ?? { weight: 0.80, reason: "Unknown gene — no complexity estimate available" };
  }

  // ─── FACTOR 6: Phasing Certainty ────────────────────────────────
  scorePhasings(vcf: any) {
    if (vcf.phasing === 'phased') {
      return { weight: 1.00, reason: "Phased — haplotype assignment certain" };
    }

    const heterozygousCount = vcf.variants ? vcf.variants.filter((v: any) => 
      v.genotype === '0/1' || v.genotype === '1/0'
    ).length : 0;

    if (heterozygousCount === 0) {
      return { weight: 1.00, reason: "All homozygous — phasing irrelevant" };
    }

    if (heterozygousCount === 1) {
      return { weight: 0.90, reason: "1 het call — minimal phase ambiguity" };
    }

    return { 
      weight: Math.max(0.60, 0.90 - (heterozygousCount * 0.08)),
      reason: `${heterozygousCount} unphased het calls — diplotype assignment uncertain`
    };
  }

  // ─── FACTOR 7: Allele Frequency Plausibility ────────────────────
  scoreAlleleFrequency(variants: any[]) {
    if (!variants || variants.length === 0) {
      return { weight: 1.00, reason: "No variants — wildtype assumption" };
    }

    const suspiciousVariants = variants.filter(v => {
      const af = parseFloat(v.alleleFrequency || "0");
      return af > 0 && af < 0.001; // <0.1% population frequency (and not 0/undefined)
    });

    if (suspiciousVariants.length === 0) {
      return { weight: 1.00, reason: "All variants have plausible population frequency" };
    }

    return {
      weight: Math.max(0.70, 1.0 - (suspiciousVariants.length * 0.10)),
      reason: `${suspiciousVariants.length} variant(s) with AF<0.1% — possible sequencing artifact`
    };
  }

  // ─── HELPERS ────────────────────────────────────────────────────
  findDominantPenalty(factors: any) {
    const sorted = Object.entries(factors)
      .sort(([,a]: any, [,b]: any) => a.weight - b.weight);
    return sorted[0] as [string, ConfidenceFactor];
  }

  classifyScore(score: number) {
    if (score >= 0.90) return { label: 'High',   color: 'GREEN'  };
    if (score >= 0.70) return { label: 'Medium', color: 'YELLOW' };
    if (score >= 0.50) return { label: 'Low',    color: 'ORANGE' };
    return               { label: 'Very Low', color: 'RED'    };
  }
}
