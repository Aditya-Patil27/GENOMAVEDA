import { NextResponse } from "next/server";

/**
 * POST /api/parse-symptom
 *
 * Accepts a voice transcript + drug name, uses LLM to extract
 * structured symptom data with severity rating.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, drug } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript required" }, { status: 400 });
    }

    // Try LLM extraction
    const provider = process.env.LLM_PROVIDER || "groq";
    let result = null;

    try {
      if (provider === "groq" && process.env.GROQ_API_KEY) {
        result = await extractWithGroq(transcript, drug || "Unknown");
      } else if (provider === "gemini" && process.env.GEMINI_API_KEY) {
        result = await extractWithGemini(transcript, drug || "Unknown");
      }
    } catch (err) {
      console.error("[parse-symptom] LLM extraction failed:", err);
    }

    // Fallback: keyword-based extraction
    if (!result) {
      result = keywordExtraction(transcript);
    }

    return NextResponse.json({
      symptom: result.symptom,
      severity: result.severity,
      category: result.category,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse symptom" },
      { status: 500 }
    );
  }
}

interface SymptomResult {
  symptom: string;
  severity: number;
  category: string;
}

async function extractWithGroq(
  transcript: string,
  drug: string
): Promise<SymptomResult> {
  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a medical symptom parser. Extract the primary symptom, its severity (1-10), and category from a patient transcript about ${drug}. Reply ONLY with valid JSON: {"symptom":"...", "severity": N, "category":"muscular|GI|neurological|cardiovascular|dermatological|respiratory|general"}`,
      },
      { role: "user", content: transcript },
    ],
    temperature: 0.1,
    max_tokens: 100,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(text);
  return {
    symptom: parsed.symptom || "Reported symptom",
    severity: Math.max(1, Math.min(10, parseInt(parsed.severity) || 5)),
    category: parsed.category || "general",
  };
}

async function extractWithGemini(
  transcript: string,
  drug: string
): Promise<SymptomResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Extract the primary symptom, severity (1-10), and category from this patient transcript about ${drug}. Reply ONLY with valid JSON: {"symptom":"...", "severity": N, "category":"muscular|GI|neurological|cardiovascular|dermatological|respiratory|general"}\n\nTranscript: "${transcript}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Strip markdown code fences if present
  const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(jsonStr);
  return {
    symptom: parsed.symptom || "Reported symptom",
    severity: Math.max(1, Math.min(10, parseInt(parsed.severity) || 5)),
    category: parsed.category || "general",
  };
}

function keywordExtraction(transcript: string): SymptomResult {
  const lower = transcript.toLowerCase();

  // Severity keywords
  let severity = 5;
  if (/unbearable|excruciating|worst|agonizing|emergency/.test(lower)) severity = 9;
  else if (/really bad|very painful|intense|severe|strong|awful/.test(lower)) severity = 7;
  else if (/aching|uncomfortable|moderate|sore|hurts/.test(lower)) severity = 5;
  else if (/mild|slight|minor|barely|tiny/.test(lower)) severity = 3;

  // Category detection
  let category = "general";
  if (/muscle|aching|cramp|stiff|weakness/.test(lower)) category = "muscular";
  else if (/nausea|vomit|stomach|diarrhea|digest|appetite/.test(lower)) category = "GI";
  else if (/dizzy|headache|numb|tingling|confusion|drowsy/.test(lower)) category = "neurological";
  else if (/heart|chest|palpitation|blood pressure/.test(lower)) category = "cardiovascular";
  else if (/rash|itch|skin|hive|swelling/.test(lower)) category = "dermatological";
  else if (/breath|cough|wheez/.test(lower)) category = "respiratory";

  // Symptom name
  const symptomMatches = lower.match(
    /(muscle ach(?:e|ing)|headache|nausea|dizziness|rash|fatigue|pain|cramp|vomiting|itching|numbness|drowsiness|chest pain|breathing difficulty)/
  );
  const symptom = symptomMatches ? symptomMatches[1] : "reported symptom";

  return { symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1), severity, category };
}
