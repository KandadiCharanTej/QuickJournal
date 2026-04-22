require("dotenv").config();
const fetch = require('node-fetch');

async function test() {
    const API_KEY = process.env.GROQ_API_KEY;
    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function generateWithAI(prompt, retries = 2) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "gemma2-9b-it",
                            messages: [{ role: "user", content: prompt }],
                            max_tokens: 600
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 429 && attempt < retries) {
                        console.log(`Rate limit hit, retrying attempt ${attempt}...`);
                        await delay(2000);
                        continue;
                    }
                    throw new Error(data.error?.message || "API failed");
                }
                return data.choices[0].message.content;
            } catch (err) {
                if (attempt === retries) {
                    console.error("AI ERROR:", err.message);
                    throw err;
                }
            }
        }
    }

    try {
        console.log("Starting 5 parallel/sequential requests...");
        for(let i=0; i<5; i++) {
            const text = await generateWithAI("write a short 50 word paragraph");
            console.log(`Req ${i+1} done: ${text.substring(0, 20)}...`);
        }
    } catch(e) {
        console.error("FINAL ERROR:", e);
    }
}
test();
