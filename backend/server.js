require("dotenv").config();

console.log("API KEY STATUS:", process.env.GROQ_API_KEY ? "FOUND" : "MISSING");

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Essential for rate limiting to work behind Render/Heroku proxies

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

// 🔐 STEP 1 & 2: Add Rate Limiter (20 requests per 15 min)
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many requests. Please try later." }
});
app.use("/api/", limiter);

// ⏱️ STEP 3: Add Cooldown Map (Anti-spam)
const lastRequestTime = new Map();

// 📦 STEP 5: Add Cache Map
const cache = new Map();

function cooldown(req, res, next) {
    const ip = req.ip;
    const now = Date.now();

    if (lastRequestTime.has(ip)) {
        const diff = now - lastRequestTime.get(ip);
        if (diff < 30000) { // 30 seconds
            return res.status(429).json({ error: "Wait 30 seconds before next request" });
        }
    }

    lastRequestTime.set(ip, now);
    next();
}

/* =========================
   AI FUNCTION
========================= */
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
                        model: "llama-3.1-8b-instant",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 600
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // If it's a rate limit error (429) and we have retries left, wait and retry
                if (response.status === 429 && attempt < retries) {
                    console.log(`Rate limit hit, retrying attempt ${attempt}...`);
                    await delay(2000); // Wait 2 seconds
                    continue;
                }
                throw new Error(data.error?.message || "API failed");
            }

            if (!data?.choices?.[0]?.message?.content) {
                throw new Error("No content returned from AI");
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

/* =========================
   ROUTE
========================= */
app.post("/api/generate", cooldown, async (req, res) => {
    try {
        const { subject, moduleRoman, topic, syllabus } = req.body;

        // ⚡ STEP 4: Validate inputs and length
        if (!subject || !moduleRoman || !topic) {
            return res.status(400).json({ error: "Missing required fields for journal generation." });
        }
        if (JSON.stringify(req.body).length > 2000) {
            return res.status(400).json({ error: "Input too long or invalid" });
        }

        // 🎲 ADD RANDOM VARIATION
        const variation = Math.floor(Math.random() * 1000);

        // 📦 LIMIT CACHE SIZE
        if (cache.size > 50) {
            cache.clear();
        }

        // 📦 STEP 5: Check Cache (Updated Key)
        const cacheKey = JSON.stringify({ subject, moduleRoman, topic, syllabus }) + "_" + variation;
        if (cache.has(cacheKey)) {
            console.log("Serving from cache!");
            return res.json({ text: cache.get(cacheKey) });
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
- NEVER invent or use specific names for professors (like Professor Patel, Dr. Smith, etc.). Use generic terms like 'the professor' or 'our instructor'.
- You may use small paragraphs or bullet points if it makes the journal clearer.
- DO NOT start the text with a heading or the section name.
- NO markdown (except for standard text formatting, no bold/italics symbols)

VARIATION REQUIREMENT:
- Write a completely unique version of this journal.
- Use different phrasing, examples, and structure.
- Do not repeat standard textbook definitions.
- Make it sound like it was written by a different student.
- Variation ID: ${variation}

WORD COUNT:
- Exactly 400 - 450 words for this section alone. DO NOT write less than 400 words.

OUTPUT FORMAT:
Return ONLY the content for this section. DO NOT include any conversation, intro, or explanation outside the content.
`;
            
            let text = await generateWithAI(prompt);
            
            // Clean up the text
            // 1. Remove accidental section headings at the start (e.g. "Experience:", "Feelings\n")
            const headingRegex = new RegExp(`^\\s*\\**\\s*${sec.name}\\s*\\**\\s*[:\\-]?\\s*\\n*`, "i");
            text = text.replace(headingRegex, "");
            
            // 2. Reduce multiple line breaks (empty lines) to a single line break. 
            // This allows small paragraphs but removes extra spaces between them.
            text = text.replace(/\n{2,}/g, "\n");
            
            // Append to full text, wrapping in the tags the frontend expects:
            fullText += `[${sec.tag}]\n${text.trim()}\n\n`;
        }
        
        fullText += "[END]\n"; // To satisfy the "END" tag for the conclusion extraction

        // 📦 STEP 5: Save to Cache before responding
        cache.set(cacheKey, fullText);

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