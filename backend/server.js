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
   AI FUNCTION (Lightning Fast Rotation)
========================= */
const delay = ms => new Promise(res => setTimeout(res, ms));

async function generateWithAI(prompt) {
    if (GROQ_KEYS.length === 0) {
        throw new Error("No valid API keys found in .env.");
    }

    let lastError = null;

    // Create all possible combinations of Keys + Models
    let combos = [];
    for (let k = 0; k < GROQ_KEYS.length; k++) {
        for (let m = 0; m < GROQ_MODELS.length; m++) {
            combos.push({ key: GROQ_KEYS[k], model: GROQ_MODELS[m], kIdx: k });
        }
    }
    
    // Shuffle the combinations to spread the load randomly and avoid hammering one key
    combos = combos.sort(() => Math.random() - 0.5);

    for (const combo of combos) {
        try {
            console.log(`Trying Key ${combo.kIdx + 1} with Model ${combo.model}...`);
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
                        max_tokens: 600,
                        temperature: 0.7
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const errMsg = data.error?.message || "";
                
                // If Rate Limited, DO NOT WAIT. Instantly skip to the next combo!
                if (response.status === 429) {
                    lastError = new Error(errMsg);
                    continue; 
                }

                // If Server Error, skip to the next combo!
                if (response.status >= 500) {
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
            // Instantly try next combo on network errors
        }
    }

    throw new Error(`CRITICAL: All APIs busy. Last error: ${lastError?.message}`);
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
        console.error("SECTION ERROR (Using Fallback):", err.message);
        
        // 🛡️ 100% FAIL-SAFE FALLBACK SYSTEM 🛡️
        // If ALL APIs fail (1000+ simultaneous requests), we NEVER show an error to the user.
        // We gracefully return a highly academic generic template.
        
        const fallbackTemplates = {
            "EXP": `The classroom experience covering ${req.body.topic || 'this topic'} was highly engaging and informative. The professor introduced the fundamental concepts by connecting them to real-world applications and industry standards. We started with the theoretical basics before moving into practical examples. I actively took notes and paid close attention as complex mechanisms were broken down into simpler, understandable parts. The interactive nature of the lecture helped maintain my focus throughout the session, and the analogies used made the abstract concepts much easier to visualize. Overall, the pacing of the class was perfect for absorbing such detailed information.`,
            "FEEL": `Initially, I felt a mix of curiosity and slight confusion as the new concepts were introduced, given the technical depth of the material. However, as the lecture progressed and more examples were provided, my confusion slowly transformed into confidence. I felt particularly intrigued by how these theoretical concepts apply to modern technological problems. By the end of the session, I felt a strong sense of accomplishment in having grasped the core principles, replacing my initial anxiety with genuine enthusiasm for the subject matter.`,
            "LEARN": `My primary takeaway from this session was a solid understanding of the mechanics behind ${req.body.topic || 'this topic'}. I learned the foundational rules, syntax, and structural requirements necessary to implement these ideas effectively. Specifically, the analogies provided in class made the abstract concepts much more concrete. I now understand not just the 'how', but the 'why' behind these specific techniques. This deep theoretical and practical understanding will be crucial for my upcoming technical assessments and lab work.`,
            "APP": `I plan to apply this knowledge directly in my upcoming academic projects and practical lab sessions. Understanding ${req.body.topic || 'these core concepts'} is essential for building robust and scalable systems in my future career. By mastering these principles now, I am laying a strong foundation for advanced topics in this subject. I will start by writing small practice programs and diagrams to solidify my understanding, which will allow me to troubleshoot complex engineering problems more effectively in the industry.`,
            "CONC": `In conclusion, this module was a significant step forward in my academic journey and technical development. The deep dive into the subject clarified many doubts I previously held and connected several dots from previous lectures. I now feel prepared to tackle more complex challenges in this subject area. This learning experience has not only improved my technical knowledge base but also refined my analytical problem-solving mindset, which I will carry forward into the rest of the semester and my professional career.`
        };

        const fallbackText = fallbackTemplates[req.body.sectionTag] || fallbackTemplates["CONC"];
        
        res.json({ text: fallbackText });
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