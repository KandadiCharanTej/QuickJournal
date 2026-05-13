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

// ⏱️ Light Anti-spam (3s cooldown instead of 15s for high traffic)
const lastRequestTime = new Map();

function cooldown(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (lastRequestTime.has(ip)) {
        const diff = now - lastRequestTime.get(ip);
        if (diff < 3000) { 
            return res.status(429).json({ error: "Please wait a moment before the next request." });
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
                        { role: "system", content: "You are a B.Tech student writing a deeply personal, human-like reflective journal. Use first-person 'I', personal analogies, and relatable class-room experiences. Write in a natural, thoughtful tone with smooth transitions." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 2000,
                    temperature: 0.95
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
   🔒 ISOLATED POOLS - Zero overlap between sections
========================= */
function getDynamicFallback(tag, subject, topic) {
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const pools = {
        EXP: {
            starters: [
                `The classroom was quiet as the professor began writing the first definition of ${topic} on the board. `,
                `We kicked off the session with a quick recap before diving headfirst into ${topic}. `,
                `Today's lecture opened with a real-world case study that connected ${topic} to everyday technology. `
            ],
            fillers: [
                `The whiteboard was covered with diagrams showing how ${topic} fits into the ${subject} pipeline. `,
                `We traced the evolution of ${topic} from its earliest form to the modern implementation used in industry today. `,
                `The professor walked us through a live coding demo that made the abstract concepts of ${topic} feel tangible. `
            ]
        },
        FEEL: {
            starters: [
                `There was a moment during the lecture when ${topic} suddenly clicked, and I felt a genuine rush of excitement. `,
                `Honestly, I walked into class feeling unsure about ${topic}, but my confidence grew with every example. `,
                `A wave of curiosity hit me when the professor posed a challenging question about ${subject}. `
            ],
            fillers: [
                `The emotional shift from confusion to clarity was one of the most satisfying parts of this module. `,
                `I remember feeling frustrated when the first example did not make sense, but persistence paid off. `,
                `By the end of the session, I felt a deep sense of accomplishment that I rarely experience in lectures. `
            ]
        },
        LEARN: {
            starters: [
                `The single most important concept I took away from this session is how ${topic} governs the underlying logic of ${subject}. `,
                `Before this class, I had a surface-level understanding of ${topic}, but now I see the deeper mechanics. `,
                `A key technical insight was realizing that ${topic} is not an isolated concept but a building block for everything in ${subject}. `
            ],
            fillers: [
                `I now understand the precise relationship between the theoretical model and its practical output. `,
                `The professor's explanation of edge cases in ${topic} helped me see why robust design matters so much. `,
                `I gained clarity on how different layers of ${subject} interact when ${topic} is applied correctly. `
            ]
        },
        APP: {
            starters: [
                `One immediate way I plan to use ${topic} is in my upcoming semester project where ${subject} plays a central role. `,
                `Thinking about my career, the knowledge of ${topic} will be directly useful in software development roles. `,
                `I have already started sketching out a personal side-project where I can experiment with ${topic} hands-on. `
            ],
            fillers: [
                `In a professional setting, ${topic} can dramatically reduce debugging time and improve code quality. `,
                `I plan to share these ${subject} strategies with my study group to improve our collaborative workflow. `,
                `The practical applications extend beyond academics; ${topic} is used in real products that millions of people depend on. `
            ]
        },
        CONC: {
            starters: [
                `Looking back at this module, my understanding of ${subject} has matured significantly. `,
                `This session marks a turning point in how I approach problem-solving within ${subject}. `,
                `If I had to summarize my growth in one sentence, it would be that ${topic} taught me to think systematically. `
            ],
            fillers: [
                `I am walking away from this class with a toolkit of concepts that will serve me for years. `,
                `The journey from confusion to confidence is exactly what higher education should feel like. `,
                `I am now eager to tackle the next module, armed with a much stronger foundation in ${subject}. `
            ]
        }
    };

    const pool = pools[tag] || pools.EXP;
    let text = r(pool.starters) + r(pool.fillers);

    // Add bullet points for LEARN and APP sections
    if (tag === 'LEARN' || tag === 'APP') {
        const bullets = [
            `Understanding the core architecture of ${topic}.`,
            `Applying ${subject} principles to real-world edge cases.`,
            `Evaluating the long-term scalability impact of ${topic}.`,
            `Building robust solutions using ${topic} best practices.`,
            `Connecting theoretical ${subject} models to production systems.`
        ];
        const selected = bullets.sort(() => 0.5 - Math.random()).slice(0, 3);
        text += "\n\nKey Takeaways:\n" + selected.map(p => "• " + p).join("\n") + "\n\n";
    }

    // Diverse padding to reach word count
    while (text.split(/\s+/).length < 480) {
        const extra = [
            `Furthermore, the methodology behind ${topic} is surprisingly elegant when you break it down step by step. `,
            `I spent extra time after class reviewing ${topic} documentation to reinforce what was taught. `,
            `The connection between ${topic} and professional software engineering was a recurring theme in the discussion. `,
            `It became clear that ${topic} is not just an academic exercise but a skill that employers actively seek. `,
            `The collaborative atmosphere of the class made it easier to digest the complexity of ${topic}. `,
            `I realized that my earlier misconceptions about ${subject} were holding me back from a deeper understanding. `
        ];
        text += r(extra);
    }
    return text;
}

/* ============================================
   🚀 SMART VARIATION POOL (2000+ Journals/Day)
   ============================================
   Strategy:
   - For each subject+module+section combo, store up to 10 unique AI-generated variations.
   - When a user requests: if pool has <10, generate fresh via AI AND save to pool.
   - If pool has 10+, randomly pick from pool (instant, no API call needed).
   - Each section has its own pool, so sections within one journal are ALWAYS different.
   - 10 variations × 5 sections = 100,000 unique journal combinations.
============================================ */
const variationPool = new Map(); // key: "subject_module_section" -> value: string[]
const MAX_VARIATIONS = 10;

// 🔒 Section-specific prompt descriptions
const SECTION_PROMPTS = {
    EXP: "Describe your classroom EXPERIENCE. What topics were discussed? What did the professor explain? What examples were given? Write as if describing the class to a friend.",
    FEEL: "Share your EMOTIONAL REACTIONS during the class. How did you feel? Were you confused, excited, nervous? Did your mood change during the lecture? Be honest and personal.",
    LEARN: "Highlight the KEY INSIGHTS you gained. What concepts clicked? What did you understand for the first time? Explain the technical knowledge you now have. You may include a few bullet points.",
    APP: "Describe how you will APPLY this knowledge in real life, projects, or your career. Give specific examples of where this theory is useful. You may include a few bullet points.",
    CONC: "Write a CONCLUSION reflecting on your overall growth. How has your thinking changed? What is the most memorable takeaway? Look forward to the next challenge."
};

app.post("/api/generate-section", async (req, res) => {
    let resultSent = false;
    try {
        const { subject, topic, sectionTag, moduleRoman, syllabus, styleInstruction } = req.body;
        const poolKey = `${subject}_${moduleRoman}_${sectionTag}`.toLowerCase().replace(/\s+/g, '_');

        // Check if we have enough variations cached
        const existingPool = variationPool.get(poolKey) || [];

        // 🔀 POOL IS FULL → Serve from cache (instant, no API call)
        if (existingPool.length >= MAX_VARIATIONS) {
            const randomPick = existingPool[Math.floor(Math.random() * existingPool.length)];
            console.log(`[POOL] ✅ Serving cached variation for ${sectionTag} (${existingPool.length} in pool)`);
            resultSent = true;
            return res.json({ text: randomPick });
        }

        // 🤖 POOL NOT FULL → Generate fresh AI content AND add to pool
        const sectionGuide = SECTION_PROMPTS[sectionTag] || SECTION_PROMPTS.EXP;
        const variationNumber = existingPool.length + 1;

        const prompt = `
You are a B.Tech student writing a reflective journal for an academic submission.
This is VARIATION #${variationNumber} — make it completely different from any previous versions.

SUBJECT: ${subject}
MODULE: Module ${moduleRoman}
TOPIC: ${topic}
SYLLABUS/CONTENT: ${syllabus || topic}

SECTION TO WRITE: ${sectionTag}
SECTION PURPOSE: ${sectionGuide}

${styleInstruction ? `OPENING INSTRUCTION: ${styleInstruction}` : ''}

RULES:
- Write approximately 450-550 words for this ONE section only.
- Write in FIRST PERSON ("I learned", "I felt").
- Use SIMPLE English with academic clarity.
- Be HUMAN-LIKE, natural, thoughtful, NOT robotic.
- Use relatable real-life examples and analogies.
- Smooth transitions between sentences.
- Focus on DEPTH OF REFLECTION, not just explanation.
- For LEARN and APP sections, you MAY include 2-3 bullet points to highlight key insights.
- DO NOT repeat the same opening phrase as other sections.
- DO NOT use markdown formatting like ** or ##.
- This is variation ${variationNumber} of ${MAX_VARIATIONS}. Make the opening line UNIQUE.
        `;

        console.log(`[POOL] 🤖 Generating variation #${variationNumber} for ${poolKey}`);
        let text = "";
        try {
            text = await generateWithAI(prompt);
        } catch (aiErr) {
            console.log(`[POOL] ⚠️ AI failed, using fallback for ${sectionTag}`);
            text = getDynamicFallback(sectionTag, subject, topic);
        }

        // Minimum length guard
        if (text.split(/\s+/).length < 300) {
            text += " " + getDynamicFallback(sectionTag, subject, topic).substring(0, 800);
        }

        // Save to pool
        existingPool.push(text.trim());
        variationPool.set(poolKey, existingPool);
        console.log(`[POOL] 📦 Pool for ${poolKey}: ${existingPool.length}/${MAX_VARIATIONS} variations stored`);

        // Cap total memory (max 500 keys in the pool)
        if (variationPool.size > 500) {
            const oldestKey = variationPool.keys().next().value;
            variationPool.delete(oldestKey);
        }

        if (!resultSent) {
            resultSent = true;
            res.json({ text: text.trim() });
        }

    } catch (err) {
        if (!resultSent) {
            resultSent = true;
            const tag = req.body.sectionTag || "CONC";
            res.json({ text: getDynamicFallback(tag, req.body.subject || "the subject", req.body.topic || "the topic") });
        }
    }
});

app.get("/", (req, res) => res.send("QuickJournal Engine Active 🚀"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));