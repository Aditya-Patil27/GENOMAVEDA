// Quick diagnostic script to test both Sarvam APIs
const API_KEY = "sk_7qtikpk7_tNg4io2XBYeFsVDwO4hVwB59";

async function testChat() {
  console.log("=== Testing Chat Completions API ===");
  console.log("URL: https://api.sarvam.ai/v1/chat/completions");
  console.log("Model: sarvam-m");
  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": API_KEY
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, what is paracetamol?" }
        ],
        temperature: 0.4,
        max_tokens: 100
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response:", text.slice(0, 500));
  } catch (err) {
    console.error("Chat API Error:", err.message || err);
  }
}

async function testTTS() {
  console.log("\n=== Testing TTS API ===");
  console.log("URL: https://api.sarvam.ai/text-to-speech");
  console.log("Model: bulbul:v3");
  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": API_KEY
      },
      body: JSON.stringify({
        input: "नमस्कार",
        language_code: "mr-IN",
        speaker: "aditya",
        model: "bulbul:v3"
      }),
      signal: AbortSignal.timeout(30000)
    });

    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response (first 300 chars):", text.slice(0, 300));
  } catch (err) {
    console.error("TTS API Error:", err.message || err);
  }
}

(async () => {
  await testChat();
  await testTTS();
  console.log("\n=== Done ===");
})();
