/**
 * Feature flags module — replaces the DEMO_MODE env var anti-pattern.
 * 
 * Usage:
 *   import { flags } from "@/lib/feature-flags";
 *   if (flags.useLLM) { ... }
 * 
 * To enable a flag: set the corresponding env var to "true" in .env.local
 */

export interface FeatureFlags {
  /** Use real LLM API calls (Groq/Gemini). False = return static fallback explanations. */
  useLLM: boolean;
  /** Fetch live CPIC recommendations from the API. False = use offline dict only. */
  useLiveCPIC: boolean;
  /** Show developer debug panels in the UI. */
  showDevTools: boolean;
}

function parseBool(val: string | undefined, defaultVal: boolean): boolean {
  if (val === undefined) return defaultVal;
  return val.toLowerCase() === "true";
}

export const flags: FeatureFlags = {
  useLLM: parseBool(process.env.FEATURE_USE_LLM, true),
  useLiveCPIC: parseBool(process.env.FEATURE_USE_LIVE_CPIC, true),
  showDevTools: parseBool(process.env.FEATURE_SHOW_DEV_TOOLS, false),
};
