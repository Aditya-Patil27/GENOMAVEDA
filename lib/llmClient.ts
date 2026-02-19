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
  return `Pharmacogenomics analysis for CPIC-aligned clinical system.
Drug: ${input.drug} | Gene: ${input.gene}
Phenotype: ${input.phenotype} (${phenotypeNames[input.phenotype] ?? "Unknown"})
Diplotype: ${input.diplotype} | Risk: ${input.risk_label}

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
    const response = await client.chat.completions.create(
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical pharmacogenomics AI. Return only valid JSON with exactly 5 keys: summary, biological_mechanism, variant_impact, clinical_context, disclaimer.",
          },
          { role: "user", content: buildPrompt(input) },
        ],
        temperature: 0.3,
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

export async function generateExplanation(
  input: ExplainerInput
): Promise<LLMExplanation> {
  // Demo mode bypass
  if (process.env.DEMO_MODE === "true") {
    return fallbackExplanation(input);
  }

  const provider = process.env.LLM_PROVIDER ?? "groq";

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

    return parsed as LLMExplanation;
  } catch (error) {
    console.error(`[LLM][${provider}] Failed — activating fallback:`, error);
    return fallbackExplanation(input);
  }
}
