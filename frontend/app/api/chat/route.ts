import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp, CORS_HEADERS } from "@/lib/rate-limit";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing_key" });

const SYSTEM_PROMPT = `You are PharmaGuard AI — an expert pharmacogenomics assistant.
You help users understand:
- Drug-gene interactions (CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD, etc.)
- Metabolizer phenotypes (Poor / Intermediate / Normal / Rapid / Ultra-Rapid)
- CPIC clinical guidelines and drug safety recommendations
- How genetic variants affect drug metabolism and dosing

Rules:
- Always be accurate, cite CPIC guidelines when relevant
- Never make specific clinical dosing decisions — always recommend consulting a pharmacist or physician
- Keep answers clear, concise, and accessible to both patients and clinicians
- If asked about a specific drug, explain the relevant gene interactions`;

const MAX_MESSAGE_LENGTH = 1500;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/chat");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const { message, history, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "No message provided" }, { status: 400, headers: CORS_HEADERS });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ reply: "Groq API key is missing. Please configure GROQ_API_KEY in your environment." }, { headers: CORS_HEADERS });
    }

    const sanitizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!sanitizedMessage) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400, headers: CORS_HEADERS });
    }

    const finalSystemPrompt = context
      ? `${SYSTEM_PROMPT}\n\nHere is the user's latest pharmacogenomic report data to use as context for answering their query:\n${String(context).slice(0, 2000)}`
      : SYSTEM_PROMPT;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: finalSystemPrompt },
    ];

    if (Array.isArray(history)) {
      const safeHistory = history
        .filter((t) => t?.role === "user" || t?.role === "assistant")
        .slice(-8)
        .map((t) => ({
          role: t.role as "user" | "assistant",
          content: typeof t.content === "string" ? t.content.slice(0, MAX_MESSAGE_LENGTH) : "",
        }))
        .filter((t) => t.content.length > 0);
      messages.push(...safeHistory);
    }

    messages.push({ role: "user", content: sanitizedMessage });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_tokens: 512,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[chat] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500, headers: CORS_HEADERS });
  }
}
