require("dotenv").config();

console.log("API KEY STATUS:", process.env.GROQ_API_KEY ? "FOUND" : "MISSING");

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// 📂 PERSISTENT CACHE SETUP
const CACHE_FILE = path.join(__dirname, "journal_cache.json");
let cache = new Map();

// Load cache from file on startup
try {
    if (fs.existsSync(CACHE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        cache = new Map(Object.entries(data));
        console.log(`Loaded ${cache.size} cached journals from disk.`);
    }
} catch (e) {
    console.error("Failed to load cache file:", e.message);
}

// Helper to save cache
function saveCache() {
    try {
        const obj = Object.fromEntries(cache);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error("Failed to save cache:", e.message);
    }
}

app.set('trust proxy', 1); // Essential for rate limiting to work behind Render/Heroku proxies

app.use(cors());
app.use(express.json());

const GROQ_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
].filter(k => k && k.length > 10 && !k.includes("PASTE_YOUR"));

const GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768"
];

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
   AI FUNCTION (Hyper-Robust Rotation)
========================= */
const delay = ms => new Promise(res => setTimeout(res, ms));

async function generateWithAI(prompt) {
    if (GROQ_KEYS.length === 0) {
        throw new Error("No valid API keys found in .env. Please check your setup.");
    }

    let lastError = null;

    // TRY EVERY KEY
    for (let kIndex = 0; kIndex < GROQ_KEYS.length; kIndex++) {
        const currentKey = GROQ_KEYS[kIndex];

        // TRY EVERY MODEL
        for (let mIndex = 0; mIndex < GROQ_MODELS.length; mIndex++) {
            const currentModel = GROQ_MODELS[mIndex];
            
            console.log(`Trying Key ${kIndex + 1} with Model ${currentModel}...`);

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const response = await fetch(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${currentKey}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                model: currentModel,
                                messages: [{ role: "user", content: prompt }],
                                max_tokens: 600,
                                temperature: 0.7
                            })
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        const errMsg = data.error?.message || "";
                        
                        // Handle Rate Limits (429)
                        if (response.status === 429) {
                            console.warn(`[429] Key ${kIndex + 1} + ${currentModel} limited.`);
                            
                            // If it's a short wait, just wait it out
                            const matchSecs = errMsg.match(/Please try again in ([0-9.]+)s/);
                            if (matchSecs && parseFloat(matchSecs[1]) <= 3 && attempt < 2) {
                                await delay(parseFloat(matchSecs[1]) * 1000 + 500);
                                continue;
                            }
                            
                            // Otherwise, move to next model/key
                            break; 
                        }

                        // Handle Server Errors (500, 503)
                        if (response.status >= 500) {
                            console.warn(`[${response.status}] Server error, retrying...`);
                            await delay(1000);
                            continue;
                        }

                        throw new Error(errMsg || `Status ${response.status}`);
                    }

                    if (data?.choices?.[0]?.message?.content) {
                        return data.choices[0].message.content.trim();
                    }
                    
                    throw new Error("Empty response from AI");

                } catch (err) {
                    lastError = err;
                    console.error(`Attempt Failed:`, err.message);
                    if (attempt === 2) break;
                }
            }
        }
    }

    throw new Error(`CRITICAL: All ${GROQ_KEYS.length} keys and ${GROQ_MODELS.length} models failed. Error: ${lastError?.message}`);
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

        // 🎲 OPTIMIZED CACHE: Only 6 variations allowed per topic.
        // This ensures that if 10 students request the same topic, 4 will likely get a cached version.
        const variation = Math.floor(Math.random() * 6);

        // 📦 LIMIT CACHE SIZE
        if (cache.size > 200) {
            cache.clear();
        }

        // 📦 STEP 5: Check Cache (Updated Key)
        const cacheKey = JSON.stringify({ subject, moduleRoman, topic, syllabus }) + "_" + variation;
        if (cache.has(cacheKey)) {
            console.log(`Serving cached variation ${variation} for ${topic}`);
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
        saveCache(); // PERSIST TO DISK
        res.json({ text: fullText });

    } catch (err) {
        console.error("ROUTE ERROR:", err.message);
        const isRateLimit = err.message.includes("wait") || err.message.includes("Limit");
        res.status(isRateLimit ? 429 : 500).json({ 
            error: isRateLimit ? err.message : "AI failed", 
            details: err.message 
        });
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
        
        // Cache single sections too if needed, but for now we focus on saving the whole journal
        const cacheKey = JSON.stringify({ subject, moduleRoman, topic, syllabus, sectionTag }) + "_" + variation;
        cache.set(cacheKey, text.trim());
        saveCache();

    } catch (err) {
        console.error("SECTION ERROR:", err.message);
        
        let retryAfter = 0;
        const isRateLimit = err.message.includes("wait") || err.message.includes("Limit");
        
        // Extract seconds if present
        const matchSecs = err.message.match(/([0-9.]+)s/);
        if (matchSecs) retryAfter = Math.ceil(parseFloat(matchSecs[1]));

        res.status(isRateLimit ? 429 : 500).json({ 
            error: isRateLimit ? err.message : "Section generation failed", 
            retryAfter: retryAfter || (isRateLimit ? 60 : 0)
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