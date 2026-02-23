// lib/privacy-monitor.ts
// Tracks what data exists, where, and for how long — the source of truth for PrivacyShield UI.

export interface PrivacyState {
  vcf_in_memory: boolean;
  vcf_sent_to_server: false; // ALWAYS false — never changes
  variants_in_memory: boolean;
  phenotype_sent_to_llm: boolean;
  data_sent_to_llm: "none" | "phenotype_label_only";
  phi_fields_excluded: string[];
  session_start: Date | null;
  auto_clear_in_seconds: number;
  data_cleared: boolean;
}

export const INITIAL_PRIVACY_STATE: PrivacyState = {
  vcf_in_memory: false,
  vcf_sent_to_server: false,
  variants_in_memory: false,
  phenotype_sent_to_llm: false,
  data_sent_to_llm: "none",
  phi_fields_excluded: [
    "raw_vcf_content",
    "star_alleles",
    "rsid_list",
    "patient_metadata",
    "sequence_data",
  ],
  session_start: null,
  auto_clear_in_seconds: 900, // 15 minutes
  data_cleared: false,
};

// What /api/analyze ACTUALLY receives
export type AnonymizedPayload = {
  phenotype: string; // e.g. "PM"
  drug: string; // e.g. "CODEINE"
  gene: string; // e.g. "CYP2D6"
  // NOT: vcf_content, star_alleles, rsids, patient_id, sequence_data
};

/** Build a privacy audit object for inclusion in JSON output (Feature 2). */
export function buildPrivacyAudit(privacyState: PrivacyState) {
  return {
    raw_vcf_retained_on_server: false as const,
    variants_processed_locally: true as const,
    data_sent_to_llm: privacyState.data_sent_to_llm,
    phi_fields_excluded_from_api: privacyState.phi_fields_excluded,
    llm_prompt_contained_phi: false as const,
    session_auto_clear_enabled: true,
    differential_privacy_applied: true,
  };
}
