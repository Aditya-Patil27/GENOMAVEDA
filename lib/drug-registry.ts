/**
 * Dynamic Drug Registry — Pulls drug list from CPIC API
 *
 * Replaces hardcoded 6-drug limit with the full CPIC guideline catalog.
 * Maintains backward compatibility by marking original 6 as "featured".
 */

import { getSupportedDrugs, CpicDrug } from "./cpic-client";

// ─── Types ──────────────────────────────────────────────────────
export interface DrugInfo {
  name: string;           // Display name (capitalized)
  nameUpper: string;      // Uppercase key for matching
  drugId: string;         // CPIC drug ID (e.g., "RxNorm:2670")
  guidelineId: number;    // CPIC guideline reference ID
  gene: string;           // Primary gene (may be empty if unknown)
  featured: boolean;      // true for the original 6 drugs
}

// ─── Known Drug→Gene Mappings ───────────────────────────────────
// These are the original 6 + extended mappings for common CPIC drugs.
// For drugs not listed here, the gene is determined from CPIC recommendation data.
const DRUG_GENE_MAP: Record<string, string> = {
  codeine: "CYP2D6",
  tramadol: "CYP2D6",
  amitriptyline: "CYP2D6",
  nortriptyline: "CYP2D6",
  atomoxetine: "CYP2D6",
  clopidogrel: "CYP2C19",
  voriconazole: "CYP2C19",
  warfarin: "CYP2C9",
  phenytoin: "CYP2C9",
  fosphenytoin: "CYP2C9",
  simvastatin: "SLCO1B1",
  atorvastatin: "SLCO1B1",
  lovastatin: "SLCO1B1",
  azathioprine: "TPMT",
  mercaptopurine: "TPMT",
  thioguanine: "TPMT",
  fluorouracil: "DPYD",
  capecitabine: "DPYD",
  abacavir: "HLA-B",
  carbamazepine: "HLA-B",
  allopurinol: "HLA-B",
};

// Original 6 featured drugs
const FEATURED_DRUGS = new Set([
  "codeine",
  "clopidogrel",
  "warfarin",
  "simvastatin",
  "azathioprine",
  "fluorouracil",
]);

// ─── Cached Drug List ───────────────────────────────────────────
let cachedDrugList: DrugInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 86400 * 1000; // 24 hours

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetch and return the full dynamic drug list from CPIC.
 * Returns DrugInfo[] sorted with featured drugs first.
 */
export async function getDrugList(): Promise<DrugInfo[]> {
  // Return cache if valid
  if (cachedDrugList && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedDrugList;
  }

  try {
    const cpicDrugs = await getSupportedDrugs();

    const drugList: DrugInfo[] = cpicDrugs.map((d: CpicDrug) => ({
      name: capitalize(d.name),
      nameUpper: d.name.toUpperCase(),
      drugId: d.drugid,
      guidelineId: d.guidelineid!,
      gene: DRUG_GENE_MAP[d.name.toLowerCase()] || "",
      featured: FEATURED_DRUGS.has(d.name.toLowerCase()),
    }));

    // Sort: featured first, then alphabetical
    drugList.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    cachedDrugList = drugList;
    cacheTimestamp = Date.now();
    return drugList;
  } catch (error) {
    console.error("[DrugRegistry] Failed to fetch dynamic drug list:", error);
    // Return hardcoded fallback
    return getFallbackDrugList();
  }
}

/**
 * Get a specific drug's info by name.
 */
export async function getDrugInfo(drugName: string): Promise<DrugInfo | null> {
  const list = await getDrugList();
  return list.find((d) => d.nameUpper === drugName.toUpperCase()) || null;
}

/**
 * Get the gene associated with a drug.
 * First checks known mappings, then falls back to CPIC data.
 */
export function getGeneForDrug(drugName: string): string {
  return DRUG_GENE_MAP[drugName.toLowerCase()] || "";
}

/**
 * Fallback drug list when CPIC API is unavailable.
 * Returns the original 6 drugs with hardcoded data.
 */
export function getFallbackDrugList(): DrugInfo[] {
  return [
    { name: "Codeine", nameUpper: "CODEINE", drugId: "RxNorm:2670", guidelineId: 100416, gene: "CYP2D6", featured: true },
    { name: "Clopidogrel", nameUpper: "CLOPIDOGREL", drugId: "RxNorm:32968", guidelineId: 100411, gene: "CYP2C19", featured: true },
    { name: "Warfarin", nameUpper: "WARFARIN", drugId: "RxNorm:11289", guidelineId: 100425, gene: "CYP2C9", featured: true },
    { name: "Simvastatin", nameUpper: "SIMVASTATIN", drugId: "RxNorm:36567", guidelineId: 100426, gene: "SLCO1B1", featured: true },
    { name: "Azathioprine", nameUpper: "AZATHIOPRINE", drugId: "RxNorm:1256", guidelineId: 100428, gene: "TPMT", featured: true },
    { name: "Fluorouracil", nameUpper: "FLUOROURACIL", drugId: "RxNorm:4492", guidelineId: 100419, gene: "DPYD", featured: true },
  ];
}

// ─── Utility ────────────────────────────────────────────────────
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
