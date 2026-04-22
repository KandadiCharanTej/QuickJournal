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

// 🔐 Relaxed Rate Limiter (100 requests per 15 min)
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
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

async function generateWithAI(prompt, retries = 4) {
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
                    let waitTime = 3000; // Default wait 3s
                    const errMsg = data.error?.message || "";
                    const match = errMsg.match(/Please try again in ([0-9.]+)s/);
                    if (match && match[1]) {
                        waitTime = parseFloat(match[1]) * 1000 + 1500; // Add 1.5s buffer
                    }
                    console.log(`Rate limit hit! Waiting ${waitTime}ms before attempt ${attempt + 1}...`);
                    await delay(waitTime);
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
app.post("/api/generate", async (req, res) => {
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
        const variation = Math.floor(Math.random() * 10);

        // 📦 LIMIT CACHE SIZE
        if (cache.size > 100) {
            cache.clear();
        }

        // 📦 STEP 5: Check Cache (Updated Key)
        const cacheKey = JSON.stringify({ subject, moduleRoman, topic, syllabus }) + "_" + variation;
        if (cache.has(cacheKey)) {
            console.log("Serving from cache!");
            return res.json({ text: cache.get(cacheKey) });
        }

        const sections = [
            { tag: "EXP", name: "Experience", focus: "Write about your classroom experience.", desc: "Describe what happened in class. What teacher explained, how concepts were introduced, and include examples (e.g. real-life analogies for concepts)." },
            { tag: "FEEL", name: "Feelings", focus: "Describe your feelings and emotional reactions.", desc: "Describe your emotions during the class. Mention confusion, curiosity, interest, struggles in understanding concepts, and how clarity developed." },
            { tag: "LEARN", name: "Learning", focus: "Explain key insights and concepts you understood deeply.", desc: "Explain what you truly understood. Detail key concepts and include concrete examples (like bank account, student system, etc.)." },
            { tag: "APP", name: "Application", focus: "Explain practical use and how you will apply this knowledge.", desc: "Explain real-life and coding applications. How you will use this in projects, practical coding scenarios, and industry relevance." },
            { tag: "CONC", name: "Conclusion", focus: "Summarize your overall learning and conclude the journal.", desc: "Summarize what changed in your thinking, your overall learning experience, and how your understanding improved." }
        ];

        let fullText = "";

        for (const sec of sections) {
            const prompt = `
You are a B.Tech student writing a deeply reflective academic journal.
Your task is to write ONLY the ${sec.name} section.
Subject: ${subject} | Module: ${moduleRoman} | Topic: ${topic}
Syllabus: ${syllabus || "General subject concepts"}

INSTRUCTIONS:
${sec.focus} ${sec.desc}
- Write 400-450 words.
- Single paragraph, no headings, no professor names.
- Variation ID: ${variation}
`;
            let text = await generateWithAI(prompt);
            text = text.replace(new RegExp(`^\\s*${sec.name}.*\\n*`, "i"), "").replace(/\n{2,}/g, "\n");
            fullText += `[${sec.tag}]\n${text.trim()}\n\n`;
        }
        
        fullText += "[END]\n";
        cache.set(cacheKey, fullText);
        res.json({ text: fullText });

    } catch (err) {
        console.error("ROUTE ERROR:", err.message);
        res.status(500).json({ error: "AI failed", details: err.message });
    }
});

// 🚀 NEW ENDPOINT: Generate a single section for live updates
app.post("/api/generate-section", async (req, res) => {
    try {
        const { subject, moduleRoman, topic, syllabus, sectionTag } = req.body;
        
        if (!subject || !moduleRoman || !topic || !sectionTag) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const sectionMap = {
            "EXP": { name: "Experience", focus: "Write about your classroom experience.", desc: "Describe what happened in class. What teacher explained, how concepts were introduced, and include examples." },
            "FEEL": { name: "Feelings", focus: "Describe your feelings and emotional reactions.", desc: "Describe your emotions during the class. Mention confusion, curiosity, interest, struggles in understanding concepts." },
            "LEARN": { name: "Learning", focus: "Explain key insights and concepts you understood deeply.", desc: "Explain what you truly understood. Detail key concepts and include concrete examples." },
            "APP": { name: "Application", focus: "Explain practical use and how you will apply this knowledge.", desc: "Explain real-life and coding applications. How you will use this in projects." },
            "CONC": { name: "Conclusion", focus: "Summarize your overall learning and conclude the journal.", desc: "Summarize what changed in your thinking, your overall learning experience." }
        };

        const sec = sectionMap[sectionTag];
        if (!sec) return res.status(400).json({ error: "Invalid section" });

        const variation = Math.floor(Math.random() * 1000);
        const prompt = `
You are a B.Tech student writing the ${sec.name} section of an academic journal.
Subject: ${subject} | Module: ${moduleRoman} | Topic: ${topic}
Syllabus: ${syllabus || "General subject concepts"}

INSTRUCTIONS:
${sec.focus} ${sec.desc}
- Exactly 400-450 words.
- Single paragraph, NO headings, NO names like "Professor Patel".
- Variation ID: ${variation}
`;

        let text = await generateWithAI(prompt);
        text = text.replace(new RegExp(`^\\s*${sec.name}.*\\n*`, "i"), "").replace(/\n{2,}/g, "\n");

        res.json({ text: text.trim() });

    } catch (err) {
        console.error("SECTION ERROR:", err.message);
        res.status(500).json({ error: "Section generation failed", details: err.message });
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