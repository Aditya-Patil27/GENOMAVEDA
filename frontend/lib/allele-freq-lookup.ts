// lib/allele-freq-lookup.ts
// Pre-compiled gnomAD population frequency lookup

import alleleFrequencies from "@/data/allele-frequencies.json";

export interface AlleleFreqData {
  variant: string;
  gene: string;
  frequencies: Record<string, number>;
  clinical_note: string;
}

const freqDB = alleleFrequencies as unknown as Record<string, AlleleFreqData>;

/**
 * Look up gnomAD allele frequency data for a given rsID.
 * Returns null if the rsID is not in our curated dataset.
 */
export function getFrequency(rsid: string): AlleleFreqData | null {
  return freqDB[rsid] ?? null;
}

/**
 * Classify a variant's frequency as Rare, Uncommon, or Common.
 */
export function classifyFrequency(maxFreq: number): {
  label: string;
  color: string;
} {
  if (maxFreq < 0.01) return { label: "Rare", color: "text-red-400" };
  if (maxFreq < 0.1) return { label: "Uncommon", color: "text-amber-400" };
  return { label: "Common", color: "text-emerald-400" };
}

/**
 * Get the maximum frequency across all populations for a given rsID.
 */
export function getMaxFrequency(rsid: string): number {
  const data = getFrequency(rsid);
  if (!data) return 0;
  return Math.max(...Object.values(data.frequencies));
}
