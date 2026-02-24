import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "Vision API not configured" },
        { status: 500 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The image comes as a base64 data URL: "data:image/jpeg;base64,...""
    const base64Data = image.split(",")[1];
    
    // We request a strict JSON output string to match our needs
    const prompt = `You are an expert pharmacist vision AI. Look at this image of a medicine package/blister pack. 
Identify the primary ACTIVE PHARMACEUTICAL INGREDIENT (not the brand name).
If you see multiple ingredients, list the primary one that is relevant for pharmacogenomics (e.g. WARFARIN, CODEINE, CLOPIDOGREL, ABACAVIR).
Return ONLY a strictly valid JSON object with a single key "ingredient" in ALL CAPS. 
If no ingredient can be reliably identified, return {"ingredient": null}.
Example: {"ingredient": "CODEINE"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const responseText = result.response.text();
    
    // Strip possible markdown fences
    const jsonStr = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    try {
      const parsed = JSON.parse(jsonStr);
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
