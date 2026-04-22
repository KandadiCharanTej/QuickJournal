require("dotenv").config();

console.log("API KEY STATUS:", process.env.GROQ_API_KEY ? "FOUND" : "MISSING");

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
                    model: "llama-3.1-8b-instant",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 900
                })
            }
        );

        const data = await response.json();

        // 🔥 IMPORTANT DEBUG
        console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            throw new Error(data.error?.message || "API failed");
        }

        if (!data?.choices?.[0]?.message?.content) {
            throw new Error("No content returned from AI");
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
        const { subject, moduleRoman, topic, syllabus } = req.body;

        if (!subject || !moduleRoman || !topic) {
            return res.status(400).json({ error: "Missing required fields for journal generation." });
        }

        const sections = [
            {
                tag: "EXP",
                name: "Experience",
                desc: "Describe what happened in class. What teacher explained, how concepts were introduced, and include examples (e.g. real-life analogies for concepts).",
                focus: "Write about your classroom experience."
            },
            {
                tag: "FEEL",
                name: "Feelings",
                desc: "Describe your emotions during the class. Mention confusion, curiosity, interest, struggles in understanding concepts, and how clarity developed.",
                focus: "Describe your feelings and emotional reactions."
            },
            {
                tag: "LEARN",
                name: "Learning",
                desc: "Explain what you truly understood. Detail key concepts and include concrete examples (like bank account, student system, etc.).",
                focus: "Explain key insights and concepts you understood deeply."
            },
            {
                tag: "APP",
                name: "Application",
                desc: "Explain real-life and coding applications. How you will use this in projects, practical coding scenarios, and industry relevance.",
                focus: "Explain practical use and how you will apply this knowledge."
            },
            {
                tag: "CONC",
                name: "Conclusion",
                desc: "Summarize what changed in your thinking, your overall learning experience, and how your understanding improved.",
                focus: "Summarize your overall learning and conclude the journal."
            }
        ];

        let fullText = "";

        // Execute sequentially to avoid TPM limits and ensure exact length
        for (const sec of sections) {
            const prompt = `
You are a B.Tech student writing a deeply reflective academic journal.
Your task is to write ONLY the ${sec.name} section of your journal.

CONTEXT:
Subject: ${subject}
Module: Module ${moduleRoman} - ${topic}
Topics Covered: ${syllabus || "General subject concepts"}

SECTION INSTRUCTIONS:
${sec.focus}
${sec.desc}

WRITING STYLE:
- Use FIRST PERSON ("I learned", "I felt")
- Sound NATURAL and HUMAN (not robotic)
- Include small imperfections like real thinking flow
- Avoid textbook definitions
- Write ONLY in paragraphs
- NO bullet points
- NO markdown

WORD COUNT:
- Exactly 400 - 450 words for this section alone. DO NOT write less than 400 words.

OUTPUT FORMAT:
Return ONLY the content for this section. DO NOT include any conversation, intro, or explanation outside the content.
`;
            
            const text = await generateWithAI(prompt);
            
            // Append to full text, wrapping in the tags the frontend expects:
            fullText += `[${sec.tag}]\n${text.trim()}\n\n`;
        }
        
        fullText += "[END]\n"; // To satisfy the "END" tag for the conclusion extraction

        res.json({ text: fullText });

    } catch (err) {
        console.error("ROUTE ERROR:", err.message);

        res.status(500).json({
            error: "AI failed",
            details: err.message
        });
    }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
    res.send("QuickJournal API running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});