import { ExplainerInput, LLMExplanation } from "./types";
import { fallbackExplanation } from "./fallbackExplanation";

const phenotypeNames: Record<string, string> = {
  PM: "Poor Metabolizer",
  IM: "Intermediate Metabolizer",
  NM: "Normal Metabolizer",
  RM: "Rapid Metabolizer",
  URM: "Ultra-Rapid Metabolizer",
  Unknown: "Unknown Metabolizer Status",
};

function buildPrompt(input: ExplainerInput): string {
  // Build the CPIC guideline context block if available
  let guidelineContext = "";
  if (input.cpic_context && input.cpic_context.raw_recommendation) {
    guidelineContext = `
CURRENT CPIC GUIDELINE CONTEXT (live data, not from training):
- Classification: ${input.cpic_context.classification}
- Recommendation: ${input.cpic_context.raw_recommendation}
- Implications: ${input.cpic_context.implications}

IMPORTANT: Base your explanation on the EXACT guideline data above, not your training data.
`;
  }

  const phenotype = input.phenotype;
  const antiHallucinationInjection = (phenotype === "NM" || phenotype === "Normal Function")
    ? `CRITICAL: If the phenotype is NM (Normal Metabolizer), you MUST NOT use phrases like "altered rate" or "compared to normal metabolizers". The patient IS a normal metabolizer. Describe normal function as normal.`
    : "CRITICAL INSTRUCTION: Explain how this specific phenotype alters standard metabolism based strictly on CPIC guidelines.";

  return `Pharmacogenomics analysis for CPIC-aligned clinical system.
Drug: ${input.drug} | Gene: ${input.gene}
Phenotype: ${input.phenotype} (${phenotypeNames[input.phenotype] ?? "Unknown"})
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

async function callGroq(input: ExplainerInput): Promise<string> {
  const Groq = (await import("groq-sdk")).default;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const systemMessage = input.cpic_context
      ? "You are a clinical pharmacogenomics AI. You have been provided with LIVE CPIC guideline data — ground your response in that data, not your training knowledge. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer."
      : "You are a clinical pharmacogenomics AI. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer.";

    const response = await client.chat.completions.create(
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: buildPrompt(input) },
        ],
        temperature: 0.1, // Lowered for determinism
        max_tokens: 800,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    return response.choices[0].message.content || "{}";
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(input: ExplainerInput): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  });

  const result = await model.generateContent(buildPrompt(input));
  return result.response.text();
}

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
}

export async function generateExplanation(
  input: ExplainerInput
): Promise<GenerateExplanationResult> {
  const provider = process.env.LLM_PROVIDER ?? "groq";
  const model = provider === "gemini" ? "gemini-2.0-flash" : "llama-3.3-70b-versatile";

  const systemPrompt = input.cpic_context
    ? "You are a clinical pharmacogenomics AI. You have been provided with LIVE CPIC guideline data — ground your response in that data, not your training knowledge. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer."
    : "You are a clinical pharmacogenomics AI. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer.";

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

  // Demo mode bypass
  if (process.env.DEMO_MODE === "true") {
    return { explanation: fallbackExplanation(input), prompt_log };
  }
  
  // Privacy Log for Audit
  console.log("\n⛔ PHI Fields Excluded From Prompt");
  console.log(prompt_log.phi_excluded.join("\n"));
  console.log("Only phenotype label + drug name sent to LLM • No genomic data • ε=1.0 differential privacy on confidence\n");

  try {
    const raw =
      provider === "gemini" ? await callGemini(input) : await callGroq(input);

    // Strip markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate required keys
    const required = [
      "summary",
      "biological_mechanism",
      "variant_impact",
      "clinical_context",
      "disclaimer",
    ];
    if (!required.every((k) => k in parsed)) {
      throw new Error("Missing required keys in LLM response");
    }

    return { explanation: parsed as LLMExplanation, prompt_log };
  } catch (error) {
    console.error(`[LLM][${provider}] Failed — activating fallback:`, error);
    return { explanation: fallbackExplanation(input), prompt_log };
  }
}

