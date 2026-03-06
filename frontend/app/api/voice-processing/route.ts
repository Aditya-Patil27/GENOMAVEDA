import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp, CORS_HEADERS } from "@/lib/rate-limit";

// Static client — initialised once at module load
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_QUERY_LENGTH = 500;
const LLM_TIMEOUT_MS = 10_000;

const SYSTEM_PROMPT = `You are GenomIX, a highly advanced multilingual AI Voice Agent serving as the interactive frontend for the PharmaGuard application.
You exist to answer pharmacogenomic questions for patients and researchers.
Your tone is professional, intelligent, concise, and futuristic. You answer in 1-2 short sentences optimized for Text-to-Speech playback.
Do not use markdown formatting since the text will be spoken aloud.`;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  // Rate limiting
  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/voice-processing");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let query = "";
  try {
    const body = await req.json();
    query = body.query;
  } catch (parseError) {
    const msg = parseError instanceof Error ? parseError.message : String(parseError);
    console.error("[VoiceAgent] JSON parse error:", msg);
    return NextResponse.json(
      { error: "Invalid JSON payload structure." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Must provide a 'query' string for the Voice Agent." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Cap input length to prevent excessive token usage
  const safeQuery = query.trim().slice(0, MAX_QUERY_LENGTH);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Voice API not configured." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const chatCompletion = await groq.chat.completions.create(
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: safeQuery },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 150,
      },
      { signal: controller.signal }
    );

    const replyText =
      chatCompletion.choices[0]?.message?.content ??
      "I am currently unable to process pharmacogenomic queries.";

    return NextResponse.json({ reply: replyText }, { headers: CORS_HEADERS });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[VoiceAgent] Groq error:", msg);
    return NextResponse.json(
      { error: "An error occurred during voice processing." },
      { status: 500, headers: CORS_HEADERS }
    );
  } finally {
    clearTimeout(timeout);
  }
}
