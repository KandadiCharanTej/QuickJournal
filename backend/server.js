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
   AI FUNCTION (True Rotation)
========================= */
async function generateWithAI(prompt) {
    if (GROQ_KEYS.length === 0) throw new Error("API_KEYS_MISSING");

    let combos = [];
    for (let k = 0; k < GROQ_KEYS.length; k++) {
        for (let m = 0; m < GROQ_MODELS.length; m++) {
            combos.push({ key: GROQ_KEYS[k], model: GROQ_MODELS[m], kIdx: k });
        }
    }
    
    // 🧬 TRUE TIME-BASED BALANCING
    const startIdx = Math.floor(Date.now() / 100) % combos.length;

    for (let i = 0; i < combos.length; i++) {
        const combo = combos[(startIdx + i) % combos.length];
        try {
            console.log(`[AI] Balanced Key ${combo.kIdx + 1} | Attempting...`);
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${combo.key}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: combo.model,
                    messages: [
                        { role: "system", content: "You are a B.Tech student writing a deeply personal, human-like reflective journal. Use first-person 'I', personal analogies, and relatable class-room experiences. Avoid robotic lists. Write in long, dense, scholarly paragraphs." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 3500,
                    temperature: 0.9 // Higher for uniqueness
                })
            });

            const data = await response.json();
            if (response.ok && data?.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        } catch (err) { continue; }
    }
    throw new Error("ALL_KEYS_FAILED");
}

/* =========================
   DYNAMIC FALLBACK GENERATOR
========================= */
function getDynamicFallback(tag, subject, topic) {
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    const intros = [
        `Our deep dive into ${topic} today was truly enlightening. `,
        `The session on ${topic} provided a much-needed perspective on ${subject}. `,
        `I found myself deeply engaged with the core concepts of ${topic} today. `,
        `The lecture focused on the intricate relationship between ${topic} and the broader ${subject} architecture. `
    ];
    
    const bodies = [
        `We explored the historical evolution of these techniques, contrasting traditional approaches with modern standards. `,
        `The professor used several real-world analogies that made the complex logic of ${topic} feel very accessible. `,
        `We spent considerable time analyzing the performance bottlenecks and the scalability challenges inherent in ${topic}. `,
        `The technical breakthroughs discussed regarding ${topic} have fundamentally changed how I view engineering design. `
    ];
    
    const reflections = [
        `Emotionally, I felt a huge surge of confidence as the pieces of the puzzle finally started to fit together. `,
        `I went from a state of total confusion to a clear, 'aha!' moment that was incredibly rewarding. `,
        `This module has boosted my academic self-esteem and reinforced my passion for ${subject}. `,
        `Mastering these ${topic} principles has made me feel much more prepared for the upcoming lab assessments. `
    ];

    const variations = [
        `The complexity of the system is a testament to the innovation in ${subject}. `,
        `I am particularly excited to apply this ${topic} logic in my final year project. `,
        `This session was a masterclass in how we bridge the gap between theory and practical execution. `
    ];

    let text = r(intros) + r(bodies) + r(reflections) + r(variations);
    
    // 🔄 FORCE 500 WORDS WITH DYNAMIC FILLERS
    while(text.split(/\s+/).length < 480) {
        text += ` Furthermore, as we look at ${topic}, we see how vital ${subject} is to the modern tech stack. We discussed the multi-dimensional implications of this ${topic} theory and how it scales. ${r(variations)} `;
    }
    return text;
}

/* =========================
   ROUTES (10/6 Uniqueness Ratio)
========================= */
const globalCache = new Map();

app.post("/api/generate-section", async (req, res) => {
    let resultSent = false;
    try {
        const { subject, topic, sectionTag, moduleRoman, syllabus } = req.body;
        
        // 📊 10/6 RATIO LOGIC (40% cached to save API, 60% unique fresh AI)
        const cacheKey = `${subject}_${topic}_${sectionTag}`.toLowerCase();
        const shouldReuse = Math.random() < 0.4; // 40% chance to reuse
        
        if (shouldReuse && globalCache.has(cacheKey)) {
            console.log(`[SYSTEM] ♻️ Reusing cached content for ${sectionTag} (10/6 Optimization)`);
            resultSent = true;
            return res.json({ text: globalCache.get(cacheKey) });
        }

        const prompt = `
            SUBJECT: ${subject}
            MODULE: ${moduleRoman}
            TOPIC: ${topic}
            SYLLABUS/CONTENT: ${syllabus || topic}
            SECTION: ${sectionTag}
            
            TASK: Write a 500-word reflective journal section.
            STYLE: Human, first-person "I", emotional, relatable. Avoid robotic academic lists.
            CONTENT: Include real-life analogies and personal classroom learning moments. 
            REQUIREMENT: Deeply reflect on the topics mentioned in the SYLLABUS/CONTENT provided above.
            STRICT: One massive paragraph. No headings. No bullets. Must be at least 500 words.
        `;

        console.log(`[SYSTEM] 🤖 Generating FRESH AI content for ${sectionTag}`);
        let text = "";
        try {
            const part1 = await generateWithAI(prompt + " Focus on the technical theory.");
            const part2 = await generateWithAI(prompt + " Focus on personal feelings and practical application.");
            text = part1 + " " + part2;
        } catch (aiErr) {
            text = getDynamicFallback(sectionTag, subject, topic);
        }

        // 🔄 MINIMUM LENGTH GUARD
        if (text.split(/\s+/).length < 450) {
            text += " " + getDynamicFallback(sectionTag, subject, topic).substring(0, 800);
        }

        // Store in cache for the 4/10 reuse ratio
        globalCache.set(cacheKey, text.trim());
        if (globalCache.size > 200) globalCache.delete(globalCache.keys().next().value);

        if (!resultSent) {
            resultSent = true;
            res.json({ text: text.trim() });
        }

    } catch (err) {
        if (!resultSent) {
            resultSent = true;
            const tag = req.body.sectionTag || "CONC";
            res.json({ text: getDynamicFallback(tag, req.body.subject, req.body.topic) });
        }
    }
});

app.get("/", (req, res) => res.send("QuickJournal Engine Active 🚀"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));