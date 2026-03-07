/**
 * Client for the National Library of Medicine (NLM) RxNorm API.
 * Used to resolve brand names (e.g., "Plavix", "Clopivas") to generic
 * active ingredients (e.g., "Clopidogrel").
 */

interface RxNormConceptGroup {
  tty: string;
  conceptProperties?: Array<{
    rxcui: string;
    name: string;
    synonym: string;
    tty: string;
    language: string;
    suppress: string;
    umlscui: string;
  }>;
}

interface RxNormResponse {
  drugGroup?: {
    name: string | null;
    conceptGroup?: RxNormConceptGroup[];
  };
}

export async function resolveToGeneric(drugName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drugName)}`, {
      method: "GET",
      // RxNorm API requires no authentication but rate-limits if hit too hard. Accept JSON.
      headers: {
        Accept: "application/json",
      },
      // Timeout to avoid hanging WhatsApp routes
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[RxNorm] Failed to fetch data for ${drugName}. Status: ${res.status}`);
      return null;
    }

    const data: RxNormResponse = await res.json();
    const conceptGroup = data?.drugGroup?.conceptGroup;

    if (!conceptGroup) {
      return null;
    }

    // Look for 'IN' (Ingredient) or 'PIN' (Precise Ingredient)
    // and prefer the generic formulation.
    for (const group of conceptGroup) {
      if (group.tty === "IN" || group.tty === "PIN") {
        if (group.conceptProperties && group.conceptProperties.length > 0) {
          // Return the normalized generic name (usually in title case or uppercase)
          // We convert it to standard title case.
          const genericName = group.conceptProperties[0].name;
          return genericName.charAt(0).toUpperCase() + genericName.slice(1).toLowerCase();
        }
      }
    }

    // If we only have 'BN' (Brand Name) or 'SBD' (Semantic Branded Drug),
    // we may need a more advanced lookup or just return null.
    return null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[RxNorm] API error resolving ${drugName}:`, msg);
    return null;
  }
}
