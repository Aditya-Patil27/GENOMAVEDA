const fs = require('fs');

async function testTTS() {
  const sarvamApiKey = "sk_7qtikpk7_tNg4io2XBYeFsVDwO4hVwB59"; // from .env.local

  const payload = {
    "inputs": ["नमस्कार! मी PharmaGuard AI आहे."],
    "target_language_code": "mr-IN",
    "speaker": "meera",
    "pitch": 0,
    "pace": 1.13,
    "loudness": 1.5,
    "speech_sample_rate": 8000,
    "enable_preprocessing": true,
    "model": "bulbul:v1"
  };

  try {
    const res = await fetch("https://api.sarvam.ai/v1/text-to-speech", { // Or perhaps /text-to-speech
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamApiKey
      },
      body: JSON.stringify({
        inputs: ["नमस्कार!"],
        target_language_code: "mr-IN",
        speaker: "meera",
        model: "bulbul:v1"
      })
    });

    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}

testTTS();
