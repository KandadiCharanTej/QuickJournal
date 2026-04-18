require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 PUT YOUR GEMINI API KEY HERE
const API_KEY = process.env.API_KEY;

app.post("/api/generate", async (req, res) => {
    const { prompt } = req.body;

    try {
        console.log("📤 Prompt received");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("📥 Gemini response:", data);

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({
                error: "AI failed",
                details: data
            });
        }

        // 🔥 IMPORTANT → match your frontend format
        res.json({
            candidates: [
                {
                    content: {
                        parts: [{ text }]
                    }
                }
            ]
        });

    } catch (err) {
        console.log("❌ Server error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});