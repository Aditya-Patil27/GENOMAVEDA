import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp, CORS_HEADERS, readBodyWithLimit } from "@/lib/rate-limit";

// Static client — initialised once at module load
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB limit for base64 image string
const IMAGE_PREFIX_RE = /^data:image\/(jpeg|png|webp|gif);base64,/;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/scan-pill");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  // Content-type guard
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Body size guard (8 MB for image payloads — base64 inflates ~33%)
  const { body, error: sizeError } = await readBodyWithLimit(request, MAX_IMAGE_BYTES);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 413, headers: CORS_HEADERS });
  }

  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(body!);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS_HEADERS });
  }

  const { image } = parsedBody;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "No image provided" }, { status: 400, headers: CORS_HEADERS });
  }

  // Validate image is a proper data-URL (prevents arbitrary string injection)
  if (!IMAGE_PREFIX_RE.test(image)) {
    return NextResponse.json(
      { error: "Image must be a valid base64 data URL (data:image/jpeg|png|webp|gif;base64,...)" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Vision API not configured" },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const prompt = `You are an expert pharmacist vision AI. Look at this image of a medicine package/blister pack.
Identify the primary ACTIVE PHARMACEUTICAL INGREDIENT (not the brand name).
If you see multiple ingredients, list the primary one that is relevant for pharmacogenomics (e.g. WARFARIN, CODEINE, CLOPIDOGREL, ABACAVIR).
Return ONLY a strictly valid JSON object with a single key "ingredient" in ALL CAPS.
If no ingredient can be reliably identified, return {"ingredient": null}.
Example: {"ingredient": "CODEINE"}`;

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 128,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed, { headers: CORS_HEADERS });
    } catch {
      return NextResponse.json({ ingredient: null, raw: responseText }, { headers: CORS_HEADERS });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[scan-pill] Error processing image:", msg);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
