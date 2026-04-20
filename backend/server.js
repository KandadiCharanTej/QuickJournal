require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const API_KEY = process.env.GROQ_API_KEY;

/* =========================
   AI FUNCTION (DEBUG)
========================= */
async function generateWithAI(prompt) {
    try {
        console.log("🔑 API KEY:", API_KEY ? "FOUND" : "MISSING");

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 4000
                })
            }
        );

        const data = await response.json();

        console.log("📥 FULL RESPONSE:", JSON.stringify(data, null, 2));

        // 🔥 IMPORTANT DEBUG
        if (data.error) {
            console.log("❌ API ERROR:", data.error);
            return { error: data.error };
        }

        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
            return { error: "No text returned" };
        }

        return { text };

    } catch (err) {
        console.log("❌ CRASH:", err);
        return { error: err.message };
    }
}

/* =========================
   ROUTE
========================= */
app.post("/api/generate", async (req, res) => {
    const { prompt } = req.body;

    console.log("📤 Prompt received");

    const result = await generateWithAI(prompt);

    if (result.error) {
        return res.status(500).json({
            error: "AI failed",
            details: result.error
        });
    }

    res.json({
        candidates: [
            {
                content: {
                    parts: [{ text: result.text }]
                }
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});