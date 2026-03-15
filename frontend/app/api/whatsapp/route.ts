import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp, CORS_HEADERS } from "@/lib/rate-limit";
import { resolveToGeneric } from "@/lib/rxnorm";

/** Strip <think>…</think> blocks that sarvam-m emits in thinking mode */
function stripThinkTags(text: string): string {
  // Remove <think>...</think> blocks (including partial/unclosed ones)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Also handle unclosed <think> tags (model sometimes doesn't close them)
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, "");
  // Also strip any leftover </think> tags
  cleaned = cleaned.replace(/<\/think>/gi, "");
  return cleaned.trim();
}

// Static client — initialised once at module load
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PHARMA_SYSTEM_PROMPT = `You are PharmaGuard AI — an expert pharmacogenomics assistant on WhatsApp.
Help users understand drug-gene interactions, metabolizer phenotypes, and CPIC guidelines.
Keep answers concise (under 300 words) and easy to read on mobile.
Always recommend consulting a pharmacist or physician for clinical decisions.
CRITICAL INSTRUCTION: You must respond in Marathi (मराठी) by default, as your primary users are from rural Maharashtra. Only use English if explicitly asked.
When discussing a medicine, if there are known adverse drug-gene interactions, you MUST suggest safer alternative medicines or alternative options suitable for the user's condition.
If a user sends a medicine image, you will receive the identified drug name and should explain its pharmacogenomic relevance in Marathi.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const userSessions = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 10;

// Groq vision docs: base64 image payloads must be <= 4MB.
// We enforce a conservative 4MB limit on downloaded media before base64 encoding.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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

  if (!phoneId || !token) {
    console.error("[whatsapp] META_WA_PHONE_ID or META_WA_TOKEN is missing.");
    return;
  }

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
    console.error(`[whatsapp] Meta send failed: ${res.status} ${err}`);
    throw new Error(`Meta send failed: ${res.status} ${err}`);
  }
}

async function generateMarathiTTS(text: string): Promise<Buffer | null> {
  const sarvamApiKey = process.env.SARVAM_API_KEY || "";
  if (!sarvamApiKey) return null;

  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamApiKey
      },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        language_code: "mr-IN",
        speaker: "rahul",
        model: "bulbul:v3",
        pace: 1.65
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!res.ok) {
      console.error("[whatsapp] TTS generation failed:", await res.text());
      return null;
    }

    const data = await res.json() as { audios: string[] };
    if (!data.audios?.[0]) return null;

    return Buffer.from(data.audios[0], "base64");
  } catch (err) {
    console.error("[whatsapp] Error generating TTS:", err);
    return null;
  }
}

async function uploadMediaToWhatsApp(buffer: Buffer, mimeType: string): Promise<string | null> {
  const phoneId = process.env.META_WA_PHONE_ID;
  const token = process.env.META_WA_TOKEN;

  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  // Meta requires a concrete, supported MIME type; ensure the Blob carries it so we don't get application/octet-stream.
  formData.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), "audio.mp3");

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
      signal: AbortSignal.timeout(15_000)
    });

    if (!res.ok) {
      console.error("[whatsapp] Meta media upload failed:", await res.text());
      return null;
    }

    const data = await res.json() as { id: string };
    return data.id;
  } catch (err) {
    console.error("[whatsapp] Error uploading media:", err);
    return null;
  }
}

async function sendWhatsAppAudio(to: string, mediaId: string): Promise<void> {
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
      type: "audio",
      audio: { id: mediaId },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[whatsapp] Audio send failed: ${res.status} ${err}`);
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
    // Groq Docs: meta-llama/llama-4-scout-17b-16e-instruct is the recommended multimodal vision model
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
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: history,
      temperature: 0.4,
      max_tokens: 400,
    });

    let reply = completion.choices?.[0]?.message?.content || "";

    // Safety: strip any stray <think> tags just in case
    reply = stripThinkTags(reply);

    if (!reply) {
      reply = "माफ करा, मला तुमचा प्रश्न समजला नाही. कृपया पुन्हा विचारा.";
    }

    history.push({ role: "assistant", content: reply });
    userSessions.set(from, history);

    return reply;
  } catch (error) {
    console.error("[whatsapp] Error calling Groq AI:", error);
    return "माफ करा, तुमची विनंती प्रक्रिया करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WA_VERIFY_TOKEN) {
    // Add bypass header for loca.lt localtunnel (returns the challenge instead of HTML warning page)
    return new Response(challenge ?? "", { 
      status: 200, 
      headers: { "Bypass-Tunnel-Reminder": "true" } 
    });
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
        await sendWhatsAppReply(from, "मला फोटो उघडता आला नाही. कृपया पुन्हा एकदा स्पष्ट फोटो पाठवा.");
        return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      }

      const drug = await identifyDrugFromMediaId(mediaId);

      if (!drug) {
        await sendWhatsAppReply(
          from,
          "मला हे औषध ओळखता आले नाही. कृपया औषधाचे नाव दिसणारा स्पष्ट फोटो पाठवा.\n\nतुम्ही तुमचा प्रश्न थेट टाइप करूनही विचारू शकता!"
        );
        return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      }

      // Try resolving brand name to generic active ingredient
      const genericDrug = await resolveToGeneric(drug);
      const identifiedText = genericDrug 
        ? `💊 *${drug}* ओळखले (मूळ औषध: *${genericDrug}*)!\n\n`
        : `💊 *${drug}* ओळखले!\n\n`;
      
      const searchTarget = genericDrug || drug;

      const explanation = await getChatReply(from, 
        `The medicine package shows the active ingredient: ${searchTarget}. Explain its pharmacogenomic relevance — which genes affect its metabolism, what metabolizer types should be cautious, and CPIC guideline summary. End by suggesting the user visit GenomaVeda for a full genomic risk report. CRITICAL: Provide the entire response in Marathi (मराठी) and suggest alternative safe medicines if there are adverse interactions.`
      );
      await sendWhatsAppReply(from, `${identifiedText}${explanation}`);

      // TTS generation for Explanation
      const audioBuffer = await generateMarathiTTS(explanation);
      if (audioBuffer) {
        // WhatsApp Cloud supports audio/mpeg, audio/ogg, etc. Sarvam returns base64 audio we can safely label as audio/mpeg for playback.
        const mediaId = await uploadMediaToWhatsApp(audioBuffer, "audio/mpeg");
        if (mediaId) {
          await sendWhatsAppAudio(from, mediaId);
        }
      }
    } else if (msgType === "text") {
      const text = ((msg.text as Record<string, string> | undefined)?.body ?? "").trim();
      if (!text) return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
      const reply = await getChatReply(from, text);
      await sendWhatsAppReply(from, reply);

      // TTS generation for generic Text Chat
      const audioBuffer = await generateMarathiTTS(reply);
      if (audioBuffer) {
        const mediaId = await uploadMediaToWhatsApp(audioBuffer, "audio/mpeg");
        if (mediaId) {
          await sendWhatsAppAudio(from, mediaId);
        }
      }
    } else {
      await sendWhatsAppReply(
        from,
        "नमस्कार! मी PharmaGuard AI आहे 💊\n\n• *प्रश्न विचारा*: औषध आणि जनुकीय परस्परसंवादाबद्दल (drug-gene interaction) विचारा\n• *फोटो पाठवा*: औषधाचा फोटो पाठवून त्याची माहिती मिळवा\n\nउदा: \"पॅरासिटामॉल (Paracetamol) सुरक्षित आहे का?\""
      );
    }

    return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[whatsapp] Handler error:", msg);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS });
  }
}
