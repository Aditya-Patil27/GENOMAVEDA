import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return NextResponse.json(
        { error: "Vision API not configured" },
        { status: 500 }
      );
    }

    // Initialize Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // The image comes as a base64 data URL: "data:image/jpeg;base64,...""
    const base64Data = image; 
    
    // We request a strict JSON output string to match our needs
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
            { type: "image_url", image_url: { url: base64Data } }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 1024,
      response_format: { type: "json_object" }
    });
    
    const responseText = completion.choices[0]?.message?.content || "{}";
    
    // Parse JSON
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch {
      // Fallback if model didn't output strict JSON
      return NextResponse.json({ ingredient: null, raw: responseText });
    }
    
  } catch (error) {
    console.error("[scan-pill] Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
