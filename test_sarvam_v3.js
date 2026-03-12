const fs = require('fs');

async function testSarvamV3() {
  const sarvamApiKey = "sk_7qtikpk7_tNg4io2XBYeFsVDwO4hVwB59";
  
  const payload = {
    input: "नमस्कार, मी फार्मागार्ड आहे.",
    language_code: "mr-IN",
    speaker: "aditya",
    model: "bulbul:v3"
  };

  console.log("Testing with URL: https://api.sarvam.ai/text-to-speech");
  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamApiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response JSON:", JSON.stringify(data, null, 2));
    
    if (res.ok && data.audios) {
      console.log("SUCCESS! Got audios array.");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testSarvamV3();
