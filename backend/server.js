require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

/* =========================
   AI FUNCTION
========================= */
async function generateWithAI(prompt) {
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
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 2000
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "API failed");
        }

        return data.choices[0].message.content;

    } catch (err) {
        console.error("AI ERROR:", err.message);
        throw err;
    }
}

/* =========================
   ROUTE
========================= */
app.post("/api/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt required" });
        }

        const text = await generateWithAI(prompt);

        res.json({ text });

    } catch (err) {
        res.status(500).json({
            error: "AI failed",
            details: err.message
        });
    }
});

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
    res.send("QuickJournal API running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});