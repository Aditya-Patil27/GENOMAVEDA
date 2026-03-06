import { ExplainerInput, LLMExplanation } from "./types";
import { fallbackExplanation } from "./fallbackExplanation";
import { PHENOTYPE_LABELS } from "./phenotype-labels";
import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { flags } from "./feature-flags";

// ─── Shared client instances (initialised once at module load) ───────────────
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Constants ───────────────────────────────────────────────────────────────
const LLM_TIMEOUT_MS = 10_000;

const SYSTEM_PROMPT_WITH_CONTEXT =
  "You are a clinical pharmacogenomics AI. You have been provided with LIVE CPIC guideline data — ground your response in that data, not your training knowledge. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer.";

const SYSTEM_PROMPT_NO_CONTEXT =
  "You are a clinical pharmacogenomics AI. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer.";

function getSystemPrompt(input: ExplainerInput): string {
  return input.cpic_context ? SYSTEM_PROMPT_WITH_CONTEXT : SYSTEM_PROMPT_NO_CONTEXT;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(input: ExplainerInput): string {
  let guidelineContext = "";
  if (input.cpic_context?.raw_recommendation) {
    guidelineContext = `
CURRENT CPIC GUIDELINE CONTEXT (live data, not from training):
- Classification: ${input.cpic_context.classification}
- Recommendation: ${input.cpic_context.raw_recommendation}
- Implications: ${input.cpic_context.implications}

IMPORTANT: Base your explanation on the EXACT guideline data above, not your training data.
`;
  }

  const phenotype = input.phenotype;
  const antiHallucinationInjection =
    phenotype === "NM" || phenotype === "Normal Function"
      ? `CRITICAL: If the phenotype is NM (Normal Metabolizer), you MUST NOT use phrases like "altered rate" or "compared to normal metabolizers". The patient IS a normal metabolizer. Describe normal function as normal.`
      : "CRITICAL INSTRUCTION: Explain how this specific phenotype alters standard metabolism based strictly on CPIC guidelines.";

  return `Pharmacogenomics analysis for CPIC-aligned clinical system.
Drug: ${input.drug} | Gene: ${input.gene}
Phenotype: ${input.phenotype} (${PHENOTYPE_LABELS[input.phenotype] ?? "Unknown"})
Risk: ${input.risk_label}
${guidelineContext}

${antiHallucinationInjection}

Return JSON with EXACTLY these 5 keys, nothing else:
{
  "summary": "2-3 sentence patient-friendly explanation",
  "biological_mechanism": "How variants affect enzyme function and drug metabolism (2-3 sentences)",
  "variant_impact": "Specific impact of this diplotype on enzyme activity",
  "clinical_context": "Clinical significance for treatment planning per CPIC guidelines",
  "disclaimer": "This is AI-generated clinical decision support only. All treatment decisions require qualified healthcare provider review."
}`.trim();
}

// ─── Provider Calls ───────────────────────────────────────────────────────────
async function callGroq(input: ExplainerInput): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await groqClient.chat.completions.create(
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: getSystemPrompt(input) },
          { role: "user", content: buildPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    return response.choices[0].message.content ?? "{}";
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(input: ExplainerInput): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    });

    // Pass the AbortSignal to the underlying fetch via globalThis signal override
    // GoogleGenerativeAI SDK does not natively accept AbortSignal; we race the promise.
    const result = await Promise.race([
      model.generateContent(buildPrompt(input)),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error("Gemini request timed out"))
        );
      }),
    ]);

    return (result as Awaited<ReturnType<typeof model.generateContent>>).response.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public Types ─────────────────────────────────────────────────────────────
export interface PromptLog {
  system_prompt: string;
  user_prompt: string;
  phi_excluded: string[];
  cpic_context_source: string;
  model: string;
  tokens_estimated: number;
}

export interface GenerateExplanationResult {
  explanation: LLMExplanation;
  prompt_log: PromptLog;
  /** True when the static fallback was used instead of a live LLM call */
  used_fallback: boolean;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const REQUIRED_KEYS = [
  "summary",
  "biological_mechanism",
  "variant_impact",
  "clinical_context",
  "disclaimer",
] as const;

export async function generateExplanation(
  input: ExplainerInput
): Promise<GenerateExplanationResult> {
  const provider = process.env.LLM_PROVIDER ?? "groq";
  const model = provider === "gemini" ? "gemini-2.0-flash" : "llama-3.3-70b-versatile";
  const systemPrompt = getSystemPrompt(input);
  const userPrompt = buildPrompt(input);

  const prompt_log: PromptLog = {
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    phi_excluded: [
      "raw_vcf_content",
      "star_alleles",
      "rsid_list",
      "patient_metadata",
      "sequence_data",
      "variant_positions",
    ],
    cpic_context_source: input.cpic_context ? "CPIC Live API (dynamic)" : "none",
    model,
    tokens_estimated: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
  };

  // Feature flag: useLLM=false returns static fallback
  if (!flags.useLLM) {
    return { explanation: fallbackExplanation(input), prompt_log, used_fallback: true };
  }

  try {
    const raw = provider === "gemini" ? await callGemini(input) : await callGroq(input);

    // Strip markdown fences if model wraps output
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!REQUIRED_KEYS.every((k) => k in parsed)) {
      throw new Error("Missing required keys in LLM response");
    }

    return { explanation: parsed as LLMExplanation, prompt_log, used_fallback: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[LLM][${provider}] Failed — activating fallback: ${msg}`);
    return {
      explanation: fallbackExplanation(input),
      prompt_log,
      used_fallback: true,
    };
  }
}
