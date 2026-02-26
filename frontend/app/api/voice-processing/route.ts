import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let query = "";
    try {
      const body = await req.json();
      query = body.query;
    } catch (parseError) {
      console.error("[VoiceAgent JSON Parse Error]", parseError);
      return NextResponse.json(
        { error: "Invalid JSON payload structure." },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Must provide a 'query' for the Voice Agent." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set. Falling back to mock response.");
      return NextResponse.json({
        reply: "Groq API key is missing. I heard: " + query,
      });
    }

    // Initialize Groq SDK
    const Groq = (await import("groq-sdk")).default;
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Build the system prompt for GenomIX Voice
    const systemPrompt = `You are GenomIX, a highly advanced multilingual AI Voice Agent serving as the interactive frontend for the PharmaGuard application.
You exist to answer pharmacogenomic questions for patients and researchers.
Your tone is professional, intelligent, concise, and futuristic. You answer in 1-2 short sentences optimized for Text-to-Speech playback.
Do not use markdown formatting since the text will be spoken aloud.`;

    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 150,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "I am currently unable to process pharmacogenomic queries.";

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("[VoiceAgent Groq Error]", error);
    return NextResponse.json(
      { error: "An error occurred during voice processing." },
      { status: 500 }
    );
  }
}
