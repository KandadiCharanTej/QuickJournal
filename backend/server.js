require("dotenv").config();

// 🐛 DEBUGGING HANDLERS (To find why it's crashing with Status 1)
process.on('uncaughtException', (err) => {
    console.error('FATAL: Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log("-----------------------------------------");
console.log("QuickJournal Backend Starting...");
console.log("Node Version:", process.version);
console.log("API KEY 1:", process.env.GROQ_API_KEY_1 ? "PRESENT" : "MISSING");
console.log("-----------------------------------------");

const express = require("express");
const cors = require("cors");
// Using native fetch available in Node 18+
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// 📂 IN-MEMORY CACHE (Safer for Serverless/PaaS like Render)
let cache = new Map();

app.set('trust proxy', 1);

// 🛡️ MORE ROBUST CORS
const corsOptions = {
    origin: '*', // Allow all for now to fix Failed to Fetch
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 📝 REQUEST LOGGER
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
    next();
});

const GROQ_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5
].filter(k => k && k.length > 10 && !k.includes("PASTE_YOUR"));

const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768"
];

// ⏱️ Anti-spam
const lastRequestTime = new Map();

function cooldown(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (lastRequestTime.has(ip)) {
        const diff = now - lastRequestTime.get(ip);
        if (diff < 15000) { 
            return res.status(429).json({ error: "Wait 15 seconds before next request" });
        }
    }

    lastRequestTime.set(ip, now);
    next();
}

/* =========================
   AI FUNCTION (Round-Robin)
========================= */
let currentComboIndex = 0;

async function generateWithAI(prompt) {
    if (GROQ_KEYS.length === 0) {
        throw new Error("No valid API keys found. Add GROQ_API_KEY_1 to 5 in your environment variables.");
    }

    let lastError = null;
    let combos = [];
    for (let k = 0; k < GROQ_KEYS.length; k++) {
        for (let m = 0; m < GROQ_MODELS.length; m++) {
            combos.push({ key: GROQ_KEYS[k], model: GROQ_MODELS[m], kIdx: k });
        }
    }
    
    for (let i = 0; i < combos.length; i++) {
        let idx = (currentComboIndex + i) % combos.length;
        const combo = combos[idx];

        try {
            console.log(`[AI] Attempting ${combo.model} (Key ${combo.kIdx + 1})...`);
            const response = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${combo.key}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: combo.model,
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 3000,
                        temperature: 0.7
                    })
                }
            );

            // Handle non-JSON or other network errors
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.warn(`[AI] Non-JSON response from ${combo.model}: ${response.status}`);
                continue;
            }

            if (!response.ok) {
                console.warn(`[AI] Key ${combo.kIdx + 1} Error: ${data.error?.message || response.status}`);
                lastError = new Error(data.error?.message || `Status ${response.status}`);
                continue; 
            }

            if (data?.choices?.[0]?.message?.content) {
                console.log(`[AI] Success with ${combo.model} (Key ${combo.kIdx + 1})!`);
                currentComboIndex = (idx + 1) % combos.length;
                return data.choices[0].message.content.trim();
            }
        } catch (err) {
            console.error(`[AI] Network/Fetch error:`, err.message);
            lastError = err;
        }
    }

    throw new Error(`CRITICAL: All AI keys failed. Final Error: ${lastError?.message}`);
}


/* =========================
   ROUTES
========================= */

app.post("/api/generate-section", async (req, res) => {
    let resultSent = false;
    try {
        const { subject, moduleRoman, topic, syllabus, sectionTag } = req.body;
        
        if (!subject || !moduleRoman || !topic || !sectionTag) {
            resultSent = true;
            return res.status(400).json({ error: "Missing fields" });
        }

        const sectionMap = {
            "EXP": { name: "Experience", focus: "Classroom experience, lecture flow, and pedagogical methods." },
            "FEEL": { name: "Feelings", focus: "Emotional and psychological journey during the class." },
            "LEARN": { name: "Learning", focus: "Technical insights and conceptual breakthroughs." },
            "APP": { name: "Application", focus: "Professional, industrial, and personal applications." },
            "CONC": { name: "Conclusion", focus: "Overall transformation and readiness for next steps." }
        };

        const sec = sectionMap[sectionTag];
        if (!sec) {
            resultSent = true;
            return res.status(400).json({ error: "Invalid section tag" });
        }

        const variation = Math.floor(Math.random() * 20); 
        const prompt = `
You are a top-tier B.Tech scholar writing the ${sec.name} section of a deep reflective journal.
Subject: ${subject} | Module: ${moduleRoman} | Topic: ${topic}
Syllabus Context: ${syllabus || topic}

TASK:
Write a MINIMUM of 500 words for this section. Be extremely verbose.
Write as ONE massive, cohesive paragraph. No headings or bullets.
Focus on: ${sec.focus}

Variation ID: ${variation}
`;

        let text = await generateWithAI(prompt);
        
        // Expansion logic
        if (text.split(/\s+/).length < 400) {
            console.log(`[${sectionTag}] Too short. Retrying expansion...`);
            text = await generateWithAI(prompt + "\n\nCRITICAL: Must expand to 500+ words. Add much more detail.");
        }

        // Clean up
        text = text.replace(new RegExp(`^\\s*(${sec.name}|Section|${sec.tag}).*\\n*`, "i"), "").replace(/\n{2,}/g, "\n");

        // Cache before sending
        const cacheKey = Buffer.from(`${topic}_${sectionTag}_${variation}`).toString('base64');
        cache.set(cacheKey, text.trim());
        if (cache.size > 500) cache.delete(cache.keys().next().value);

        if (!resultSent) {
            resultSent = true;
            res.json({ text: text.trim() });
        }

    } catch (err) {
        console.error("ROUTE ERROR:", err.message);
        
        if (!resultSent) {
            resultSent = true;
            const tag = (req.body && req.body.sectionTag) || "CONC";
            const fallbackTemplates = {
                "EXP": `The classroom experience centered around the discussion of the topic was an exceptionally profound and intellectually stimulating session that offered a comprehensive overview...`,
                "FEEL": `Reflecting upon my emotional and psychological journey during the course of this intensive lecture...`,
                "LEARN": `The technical insights and conceptual breakthroughs achieved during this session...`,
                "APP": `The practical and professional applications of the knowledge I have acquired are both vast...`,
                "CONC": `In conclusion, this comprehensive session has represented a significant milestone...`
            };
            res.json({ text: fallbackTemplates[tag] || fallbackTemplates["CONC"] });
        }
    }
});

app.get("/", (req, res) => res.send("QuickJournal Engine Active 🚀"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));