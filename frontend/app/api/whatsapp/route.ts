import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp, CORS_HEADERS } from "@/lib/rate-limit";
import { resolveToGeneric } from "@/lib/rxnorm";


// Static client — initialised once at module load
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PHARMA_SYSTEM_PROMPT = `You are PharmaGuard AI — an expert pharmacogenomics assistant on WhatsApp.
Help users understand drug-gene interactions, metabolizer phenotypes, and CPIC guidelines.
Keep answers concise (under 300 words) and easy to read on mobile.
Always recommend consulting a pharmacist or physician for clinical decisions.
If a user sends a medicine image, you will receive the identified drug name and should explain its pharmacogenomic relevance.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const userSessions = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 10;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — WhatsApp images can be large

function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.META_WA_APP_SECRET;
  if (!appSecret || !signature) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;

  try {
    // Ensure equal-length buffers before timingSafeEqual to avoid exception
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function sendWhatsAppReply(to: string, body: string): Promise<void> {
  const phoneId = process.env.META_WA_PHONE_ID;
  const token = process.env.META_WA_TOKEN;

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta send failed: ${res.status} ${err}`);
  }
}

async function identifyDrugFromMediaId(mediaId: string): Promise<string | null> {
  const token = process.env.META_WA_TOKEN;

  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!metaRes.ok) throw new Error(`Media lookup failed: ${metaRes.status}`);

  const metaData = await metaRes.json() as { url?: string };
  const imageUrl = metaData.url;
  if (!imageUrl) return null;

  // Validate URL is a facebook CDN URL (prevents SSRF to internal endpoints)
  const parsedUrl = new URL(imageUrl);
  if (!parsedUrl.hostname.endsWith(".fbcdn.net") && !parsedUrl.hostname.endsWith(".facebook.com")) {
    console.error("[whatsapp] Unexpected media URL host:", parsedUrl.hostname);
    return null;
  }

  const imgRes = await fetch(imageUrl, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);

  // Enforce image size limit before loading into memory
  const contentLength = Number(imgRes.headers.get("content-length") ?? "0");
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large: ${contentLength} bytes (max ${MAX_IMAGE_BYTES})`);
  }

  const buffer = await imgRes.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image payload exceeded maximum size after download");
  }

  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert pharmacist vision AI. Identify the primary active pharmaceutical ingredient from this medicine image.
Return ONLY valid JSON: {"ingredient": "DRUG_NAME"} in ALL CAPS, or {"ingredient": null} if unidentifiable.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 128,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      ingredient?: string | null;
    };
    return typeof parsed.ingredient === "string" ? parsed.ingredient : null;
  } catch {
    return null;
  }
}

async function getChatReply(from: string, userMessage: string): Promise<string> {
  const sarvamApiKey = process.env.SARVAM_API_KEY || "";
  if (!sarvamApiKey) {
    console.warn("[whatsapp] SARVAM_API_KEY is not set. Chat will likely fail.");
  }

  let history = userSessions.get(from) || [];
  if (history.length === 0) {
    history.push({ role: "system", content: PHARMA_SYSTEM_PROMPT });
  }

  history.push({ role: "user", content: userMessage.slice(0, 1000) });

  if (history.length > MAX_HISTORY) {
    // Keep index 0 (system), and slice the end
    history = [history[0], ...history.slice(-(MAX_HISTORY - 1))];
  }

  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamApiKey
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: history,
        temperature: 0.4,
        max_tokens: 400
      })
    });

    if (!res.ok) {
      console.error("[whatsapp] Sarvam API error:", await res.text());
      return "Sorry, I couldn't process your question right now. (API Error)";
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process your question.";
    
    history.push({ role: "assistant", content: reply });
    userSessions.set(from, history);

    return reply;
  } catch (error) {
    console.error("[whatsapp] Error calling Sarvam AI:", error);
    return "Sorry, I ran into an error processing your query.";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WA_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/whatsapp");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const entry = (payload?.entry as unknown[])?.[0] as Record<string, unknown> | undefined;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown> | undefined;
    const value = changes?.value as Record<string, unknown> | undefined;
    const messages = value?.messages as Record<string, unknown>[] | undefined;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "no_message" }, { headers: CORS_HEADERS });
    }

    const msg = messages[0];
    const from = msg.from;
    const msgType = msg.type as string;

    // Guard: from must be a non-empty string (Meta sends status updates without 'from')
    if (!from || typeof from !== "string") {
      return NextResponse.json({ status: "status_update_ignored" }, { headers: CORS_HEADERS });
    }

    if (msgType === "image") {
      const image = msg.image as Record<string, string> | undefined;
      const mediaId = image?.id;
      if (!mediaId) {
        await sendWhatsAppReply(from, "I couldn't access the image. Please try again with a clearer photo.");
        return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      }

      const drug = await identifyDrugFromMediaId(mediaId);

      if (!drug) {
        await sendWhatsAppReply(
          from,
          "I couldn't identify the medicine. Please send a clearer photo of the front packaging showing the drug name.\n\nYou can also type your question directly!"
        );
        return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      }

      // Try resolving brand name to generic active ingredient
      const genericDrug = await resolveToGeneric(drug);
      const identifiedText = genericDrug 
        ? `💊 *${drug}* identified (Active Ingredient: *${genericDrug}*)!\n\n`
        : `💊 *${drug}* identified!\n\n`;
      
      const searchTarget = genericDrug || drug;

      const explanation = await getChatReply(from, 
        `The medicine package shows the active ingredient: ${searchTarget}. Explain its pharmacogenomic relevance — which genes affect its metabolism, what metabolizer types should be cautious, and CPIC guideline summary. End by suggesting the user visit GenomaVeda for a full genomic risk report.`
      );
      await sendWhatsAppReply(from, `${identifiedText}${explanation}`);
    } else if (msgType === "text") {
      const text = ((msg.text as Record<string, string> | undefined)?.body ?? "").trim();
      if (!text) return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      const reply = await getChatReply(from, text);
      await sendWhatsAppReply(from, reply);
    } else {
      await sendWhatsAppReply(
        from,
        "Hi! I'm PharmaGuard AI 💊\n\n• *Text*: Ask about drug-gene interactions\n• *Image*: Send a medicine package photo to identify it\n\nExample: \"What is a CYP2D6 Poor Metabolizer?\""
      );
    }

    return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[whatsapp] Handler error:", msg);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS });
  }
}
