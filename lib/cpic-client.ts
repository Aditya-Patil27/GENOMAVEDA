/**
 * CPIC REST API Client — Dynamic pharmacogenomic data source
 * Replaces static cpic-diplotypes.json and drug-gene-rules.json
 * API: https://api.cpicpgx.org/v1 (PostgREST, free, no auth)
 */

const CPIC_API = process.env.CPIC_API_BASE || "https://api.cpicpgx.org/v1";

// ─── In-Memory Cache ────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 86400 * 1000; // 24 hours in ms

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ─── Types for CPIC API Responses ───────────────────────────────
export interface CpicDiplotype {
  genesymbol: string;
  diplotype: string;
  generesult: string; // e.g. "Normal Metabolizer", "Poor Metabolizer"
  totalactivityscore: string;
  function1: string;
  function2: string;
  activityvalue1: string;
  activityvalue2: string;
  ehrpriority: string;
  consultationtext: string;
  lookupkey: Record<string, string>;
}

export interface CpicRecommendation {
  id: number;
  guidelineid: number;
  drugid: string;
  implications: Record<string, string>;
  drugrecommendation: string;
  classification: string; // "Strong", "Moderate", "Optional"
  phenotypes: Record<string, string>;
  activityscore: Record<string, string>;
  lookupkey: Record<string, string>;
  population: string;
  comments: string;
  dosinginformation: boolean;
  alternatedrugavailable: boolean;
  otherprescribingguidance: boolean;
}

export interface CpicDrug {
  name: string;
  drugid: string;
  guidelineid: number | null;
  pharmgkbid: string;
  rxnormid: string | null;
  flowchart: string | null;
}

// ─── API Fetch Helpers ──────────────────────────────────────────
async function cpicFetch<T>(path: string): Promise<T> {
  const url = `${CPIC_API}${path}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store", // In-memory cache handles TTL; don't fight with browser/Next cache
  });

  if (!res.ok) {
    throw new Error(`CPIC API error: ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetch all diplotype → phenotype mappings for a given gene from CPIC.
 * Returns a Map<diplotype_string, { phenotype, activityScore }>.
 */
export async function getDiplotypeMappings(
  gene: string
): Promise<Map<string, { phenotype: string; activityScore: string; consultationText: string }>> {
  const cacheKey = `cpic:diplotype:${gene}`;
  const cached = getCached<Map<string, { phenotype: string; activityScore: string; consultationText: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const data = await cpicFetch<CpicDiplotype[]>(
      `/diplotype?genesymbol=eq.${encodeURIComponent(gene)}&select=diplotype,generesult,totalactivityscore,consultationtext`
    );

    const map = new Map<string, { phenotype: string; activityScore: string; consultationText: string }>();
    for (const entry of data) {
      // Map CPIC's "Normal Metabolizer" → "NM", etc.
      const phenotype = cpicPhenotypeToCode(entry.generesult);
      map.set(entry.diplotype, {
        phenotype,
        activityScore: entry.totalactivityscore,
        consultationText: entry.consultationtext || "",
      });
    }

    setCache(cacheKey, map);
    return map;
  } catch (error) {
    console.error(`[CPIC] Failed to fetch diplotype mappings for ${gene}:`, error);
    return new Map(); // empty = fallback to local logic
  }
}

/**
 * Fetch drug recommendations from CPIC for a given drug ID.
 * Returns all recommendation rows for this drug across phenotypes.
 */
export async function getDrugRecommendations(
  drugId: string
): Promise<CpicRecommendation[]> {
  const cacheKey = `cpic:recommendation:${drugId}`;
  const cached = getCached<CpicRecommendation[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await cpicFetch<CpicRecommendation[]>(
      `/recommendation?drugid=eq.${encodeURIComponent(drugId)}`
    );

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`[CPIC] Failed to fetch recommendations for ${drugId}:`, error);
    return [];
  }
}

/**
 * Fetch all drugs that have a CPIC guideline.
 */
export async function getSupportedDrugs(): Promise<CpicDrug[]> {
  const cacheKey = "cpic:drugs:all";
  const cached = getCached<CpicDrug[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await cpicFetch<CpicDrug[]>(
      `/drug?guidelineid=not.is.null&select=name,drugid,guidelineid,pharmgkbid,rxnormid,flowchart`
    );

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("[CPIC] Failed to fetch supported drugs:", error);
    return [];
  }
}

/**
 * Look up a specific drug by name in CPIC.
 */
export async function getDrugByName(
  drugName: string
): Promise<CpicDrug | null> {
  const cacheKey = `cpic:drug:${drugName.toLowerCase()}`;
  const cached = getCached<CpicDrug | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const data = await cpicFetch<CpicDrug[]>(
      `/drug?name=eq.${encodeURIComponent(drugName.toLowerCase())}&select=name,drugid,guidelineid,pharmgkbid,rxnormid,flowchart`
    );

    const drug = data[0] || null;
    if (drug) setCache(cacheKey, drug);
    return drug;
  } catch (error) {
    console.error(`[CPIC] Failed to fetch drug ${drugName}:`, error);
    return null;
  }
}

// ─── Utility ────────────────────────────────────────────────────

/** Convert full CPIC phenotype names to short codes */
function cpicPhenotypeToCode(generesult: string): string {
  const lower = generesult.toLowerCase();
  if (lower.includes("ultrarapid")) return "URM";
  if (lower.includes("rapid") && !lower.includes("ultra")) return "RM";
  if (lower.includes("normal")) return "NM";
  if (lower.includes("intermediate")) return "IM";
  if (lower.includes("poor")) return "PM";
  return "Unknown";
}

/** Exported for use in confidence calculator */
export function classificationToStrength(
  classification: string
): "strong" | "moderate" | "optional" {
  const lower = classification.toLowerCase();
  if (lower === "strong") return "strong";
  if (lower === "moderate") return "moderate";
  return "optional";
}
