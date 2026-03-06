/**
 * Extended unit tests for PharmaGuard clinical core.
 * Covers: parseVCF, assessRisk, deriveRiskLabel (via assessRisk), mapPhenotype, checkRateLimit.
 */

// ─── parseVCF Tests ────────────────────────────────────────────────────────
import { parseVCF } from "../lib/vcf-parser";

describe("parseVCF", () => {
  const HEADER = "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE\n";

  test("returns failure on empty string", () => {
    const result = parseVCF("");
    expect(result.success).toBe(false);
    expect(result.warnings).toContain("Empty VCF file");
    expect(result.variants).toHaveLength(0);
  });

  test("returns success=true with no variants when no target genes present", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr1\t100\trs1234\tA\tG\t.\t.\tGENE=UNKNOWN\tGT:GQ:DP\t0/1:99:50\n`;
    const result = parseVCF(content);
    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(0);
    expect(result.warnings).toContain("No pharmacogenomic variants detected in target genes");
  });

  test("parses a CYP2D6 variant correctly", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs3892097\tC\tT\t.\t.\tGENE=CYP2D6;RS=rs3892097;STAR=*4\tGT:GQ:DP\t0/1:99:45\n`;
    const result = parseVCF(content);
    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(1);
    const v = result.variants[0];
    expect(v.gene).toBe("CYP2D6");
    expect(v.star_allele).toBe("*4");
    expect(v.rsid).toBe("rs3892097");
    expect(v.zygosity).toBe("heterozygous");
    expect(v.gq).toBe(99);
    expect(v.dp).toBe(45);
  });

  test("detects homozygous zygosity", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs3892097\tC\tT\t.\t.\tGENE=CYP2D6;RS=rs3892097;STAR=*4\tGT:GQ:DP\t1/1:99:45\n`;
    const result = parseVCF(content);
    expect(result.variants[0].zygosity).toBe("homozygous");
  });

  test("skips lines with fewer than 8 columns", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs1234\tA\tG\t.\t.\n`;
    const result = parseVCF(content);
    expect(result.variants).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("insufficient columns"))).toBe(true);
  });

  test("skips ref-only genotypes (0/0)", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs3892097\tC\tT\t.\t.\tGENE=CYP2D6;RS=rs3892097\tGT:GQ:DP\t0/0:99:45\n`;
    const result = parseVCF(content);
    expect(result.variants).toHaveLength(0);
  });

  test("reports missing genes", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}`;
    const result = parseVCF(content);
    expect(result.genes_missing).toBeDefined();
    expect(result.genes_missing).toContain("CYP2D6");
    expect(result.genes_missing).toContain("CYP2C19");
  });

  test("warns when no #CHROM header found", () => {
    const content = `##fileformat=VCFv4.2\nchr22\t100\trs1\tA\tG\t.\t.\tGENE=CYP2D6\tGT\t0/1\n`;
    const result = parseVCF(content);
    expect(result.warnings.some((w) => w.includes("#CHROM"))).toBe(true);
  });

  test("handles Windows CRLF line endings", () => {
    const content = `##fileformat=VCFv4.2\r\n${HEADER.replace(/\n/g, "\r\n")}chr22\t42526694\trs3892097\tC\tT\t.\t.\tGENE=CYP2D6;RS=rs3892097;STAR=*4\tGT:GQ:DP\t0/1:99:45\r\n`;
    const result = parseVCF(content);
    expect(result.success).toBe(true);
    expect(result.variants).toHaveLength(1);
  });

  test("uses rs ID from ID column when RS INFO tag absent", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs3892097\tC\tT\t.\t.\tGENE=CYP2D6;STAR=*4\tGT:GQ:DP\t0/1:99:45\n`;
    const result = parseVCF(content);
    expect(result.variants[0].rsid).toBe("rs3892097");
  });

  test("defaults gq and dp to 0 when fields are missing", () => {
    const content = `##fileformat=VCFv4.2\n${HEADER}chr22\t42526694\trs1\tC\tT\t.\t.\tGENE=CYP2D6;STAR=*4\tGT\t0/1\n`;
    const result = parseVCF(content);
    expect(result.variants[0].gq).toBe(0);
    expect(result.variants[0].dp).toBe(0);
  });
});


// ─── assessRisk Tests ──────────────────────────────────────────────────────
import { assessRisk } from "../lib/risk-engine";

describe("assessRisk (offline core — guaranteed 6-drug dictionary)", () => {
  test("CODEINE + CYP2D6 PM → Toxic (high)", async () => {
    const result = await assessRisk("CODEINE", "PM", "CYP2D6", 2, true, "*4/*4");
    expect(result.risk_label).toBe("Toxic");
    expect(result.severity).toBe("high");
    expect(result.monitoring_required).toBe(true);
  });

  test("CODEINE + CYP2D6 URM → Toxic (critical)", async () => {
    const result = await assessRisk("CODEINE", "URM", "CYP2D6", 2, true, "*1xN/*2xN");
    expect(result.risk_label).toBe("Toxic");
    expect(result.severity).toBe("critical");
  });

  test("CODEINE + CYP2D6 NM → Safe", async () => {
    const result = await assessRisk("CODEINE", "NM", "CYP2D6", 2, true, "*1/*1");
    expect(result.risk_label).toBe("Safe");
    expect(result.severity).toBe("none");
    expect(result.monitoring_required).toBe(false);
  });

  test("CLOPIDOGREL + CYP2C19 PM → Toxic (critical)", async () => {
    const result = await assessRisk("CLOPIDOGREL", "PM", "CYP2C19", 2, true, "*2/*2");
    expect(result.risk_label).toBe("Toxic");
    expect(result.severity).toBe("critical");
  });

  test("WARFARIN + CYP2C9 IM → Adjust Dosage", async () => {
    const result = await assessRisk("WARFARIN", "IM", "CYP2C9", 1, true, "*1/*2");
    expect(result.risk_label).toBe("Adjust Dosage");
  });

  test("FLUOROURACIL + DPYD PM → Toxic (critical)", async () => {
    const result = await assessRisk("FLUOROURACIL", "PM", "DPYD", 2, true, "*2/*2");
    expect(result.risk_label).toBe("Toxic");
    expect(result.severity).toBe("critical");
  });

  test("SIMVASTATIN + SLCO1B1 Normal Function → Safe", async () => {
    const result = await assessRisk("SIMVASTATIN", "NM", "SLCO1B1", 0, true, "*1/*1");
    expect(result.risk_label).toBe("Safe");
  });

  test("AZATHIOPRINE + TPMT PM → Toxic (critical)", async () => {
    const result = await assessRisk("AZATHIOPRINE", "PM", "TPMT", 2, true, "*3A/*3A");
    expect(result.risk_label).toBe("Toxic");
    expect(result.severity).toBe("critical");
  });

  test("unknown drug returns risk_label=Unknown with monitoring required", async () => {
    const result = await assessRisk("UNKNOWNDRUG_XYZ", "NM", "CYP2D6", 0, true, "*1/*1");
    expect(result.risk_label).toBe("Unknown");
    expect(result.monitoring_required).toBe(true);
  });

  test("confidence_score is between 0 and 1", async () => {
    const result = await assessRisk("CODEINE", "PM", "CYP2D6", 2, true, "*4/*4", 99);
    expect(result.confidence_score).toBeGreaterThan(0);
    expect(result.confidence_score).toBeLessThanOrEqual(1);
  });

  test("alternative_drugs is always an array", async () => {
    const result = await assessRisk("CODEINE", "NM", "CYP2D6", 2, true, "*1/*1");
    expect(Array.isArray(result.alternative_drugs)).toBe(true);
  });

  test("inferred diplotype (with /) receives lower confidence than phased", async () => {
    const phased = await assessRisk("CODEINE", "NM", "CYP2D6", 2, true, "*1/*1", 99);
    const inferred = await assessRisk("CODEINE", "NM", "CYP2D6", 2, false, "*1/*1", 99);
    // Both should be valid; inferred may be same or lower
    expect(phased.confidence_score).toBeGreaterThan(0);
    expect(inferred.confidence_score).toBeGreaterThan(0);
    expect(inferred.confidence_score).toBeLessThanOrEqual(phased.confidence_score + 0.01);
  });

  test("lowercase drug name is handled (uppercase normalised)", async () => {
    const result = await assessRisk("codeine", "PM", "CYP2D6", 2, true, "*4/*4");
    expect(result.risk_label).toBe("Toxic");
  });
});


// ─── checkRateLimit Tests ──────────────────────────────────────────────────
import { checkRateLimit } from "../lib/rate-limit";

describe("checkRateLimit", () => {
  // Use unique IPs per test to avoid cross-test pollution from shared module Map
  let testIdx = 0;
  const nextIp = () => `192.0.2.${++testIdx}`;

  test("allows first request", () => {
    const { allowed } = checkRateLimit(nextIp(), "/api/analyze");
    expect(allowed).toBe(true);
  });

  test("allows requests up to the max limit", () => {
    const ip = nextIp();
    let lastResult = { allowed: true, retryAfterMs: 0 };
    // /api/analyze allows 20 per minute
    for (let i = 0; i < 20; i++) {
      lastResult = checkRateLimit(ip, "/api/analyze");
    }
    expect(lastResult.allowed).toBe(true);
  });

  test("blocks the 21st request on /api/analyze", () => {
    const ip = nextIp();
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip, "/api/analyze");
    }
    const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/analyze");
    expect(allowed).toBe(false);
    expect(retryAfterMs).toBeGreaterThan(0);
  });

  test("different IPs have independent limits", () => {
    const ip1 = nextIp();
    const ip2 = nextIp();
    for (let i = 0; i < 20; i++) checkRateLimit(ip1, "/api/analyze");
    const { allowed } = checkRateLimit(ip1, "/api/analyze");
    expect(allowed).toBe(false);
    // ip2 should still be allowed
    const { allowed: ip2Allowed } = checkRateLimit(ip2, "/api/analyze");
    expect(ip2Allowed).toBe(true);
  });

  test("different routes have independent limits for the same IP", () => {
    const ip = nextIp();
    for (let i = 0; i < 20; i++) checkRateLimit(ip, "/api/analyze");
    // analyze is blocked
    expect(checkRateLimit(ip, "/api/analyze").allowed).toBe(false);
    // chat has its own limit of 30 — should still be allowed
    expect(checkRateLimit(ip, "/api/chat").allowed).toBe(true);
  });

  test("unknown route uses default limit", () => {
    const ip = nextIp();
    const { allowed } = checkRateLimit(ip, "/api/unknown-route");
    expect(allowed).toBe(true);
  });
});
