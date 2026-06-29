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
async function generateWithAI(prompt, systemContent) {
    if (GROQ_KEYS.length === 0) throw new Error("API_KEYS_MISSING");

    let combos = [];
    for (let k = 0; k < GROQ_KEYS.length; k++) {
        for (let m = 0; m < GROQ_MODELS.length; m++) {
            combos.push({ key: GROQ_KEYS[k], model: GROQ_MODELS[m], kIdx: k });
        }
    }
    
    // 🧬 TRUE TIME-BASED BALANCING
    const startIdx = Math.floor(Date.now() / 100) % combos.length;

    const defaultSystem = "You are a B.Tech student writing a deeply personal, human-like reflective journal. Use first-person 'I', personal analogies, and relatable class-room experiences. Write in a natural, thoughtful tone with smooth transitions.";
    const system = systemContent || defaultSystem;

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
                        { role: "system", content: system },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 6000,
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
    if (tag === "ASSIGNMENT") {
        return getDynamicAssignmentFallback(subject, topic);
    }
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const pools = {
        EXP: {
            starters: [
                `The classroom was quiet as the professor began writing the first definition of ${topic} on the board. `,
                `We kicked off the session with a quick recap before diving headfirst into ${topic}. `,
                `Today's lecture opened with a real-world case study that connected ${topic} to everyday technology. `,
                `The session began with an engaging discussion about how ${topic} has evolved in recent years. `,
                `I entered the class today eager to finally break down the complexity of ${topic}. `
            ],
            fillers: [
                `The whiteboard was covered with diagrams showing how ${topic} fits into the ${subject} pipeline. `,
                `We traced the evolution of ${topic} from its earliest form to the modern implementation used in industry today. `,
                `The professor walked us through a live coding demo that made the abstract concepts of ${topic} feel tangible. `,
                `We spent considerable time discussing the architectural implications of ${topic} in large-scale systems. `,
                `A major part of the discussion focused on the trade-offs between different ${topic} methodologies. `
            ]
        },
        FEEL: {
            starters: [
                `There was a moment during the lecture when ${topic} suddenly clicked, and I felt a genuine rush of excitement. `,
                `Honestly, I walked into class feeling unsure about ${topic}, but my confidence grew with every example. `,
                `A wave of curiosity hit me when the professor posed a challenging question about ${subject}. `,
                `I felt initially overwhelmed by the sheer volume of information regarding ${topic}. `,
                `There was a palpable sense of focus in the room as we collectively tackled ${topic}. `
            ],
            fillers: [
                `The emotional shift from confusion to clarity was one of the most satisfying parts of this module. `,
                `I remember feeling frustrated when the first example did not make sense, but persistence paid off. `,
                `By the end of the session, I felt a deep sense of accomplishment that I rarely experience in lectures. `,
                `I felt a new level of respect for the engineers who pioneered ${topic} after seeing its inner workings. `,
                `The collaborative energy of the class helped ease the tension I felt regarding this difficult subject. `
            ]
        },
        LEARN: {
            starters: [
                `The single most important concept I took away from this session is how ${topic} governs the underlying logic of ${subject}. `,
                `Before this class, I had a surface-level understanding of ${topic}, but now I see the deeper mechanics. `,
                `A key technical insight was realizing that ${topic} is not an isolated concept but a building block for everything in ${subject}. `,
                `I discovered that ${topic} operates on principles that are far more sophisticated than I initially thought. `,
                `The breakthrough moment for me was understanding the relationship between ${topic} and system efficiency. `
            ],
            fillers: [
                `I now understand the precise relationship between the theoretical model and its practical output. `,
                `The professor's explanation of edge cases in ${topic} helped me see why robust design matters so much. `,
                `I gained clarity on how different layers of ${subject} interact when ${topic} is applied correctly. `,
                `The session demystified several complex algorithms that I had previously found intimidating. `,
                `I learned how to optimize ${subject} workflows by leveraging the unique properties of ${topic}. `
            ]
        },
        APP: {
            starters: [
                `One immediate way I plan to use ${topic} is in my upcoming semester project where ${subject} plays a central role. `,
                `Thinking about my career, the knowledge of ${topic} will be directly useful in software development roles. `,
                `I have already started sketching out a personal side-project where I can experiment with ${topic} hands-on. `,
                `I can see myself applying ${topic} logic to solve real-world scalability issues in future internships. `,
                `This session provided a bridge between classroom theory and the practical demands of the industry. `
            ],
            fillers: [
                `In a professional setting, ${topic} can dramatically reduce debugging time and improve code quality. `,
                `I plan to share these ${subject} strategies with my study group to improve our collaborative workflow. `,
                `The practical applications extend beyond academics; ${topic} is used in real products that millions of people depend on. `,
                `I intend to use the ${topic} framework to build more responsive and user-friendly applications. `,
                `Mastering ${topic} will give me a competitive edge when applying for specialized technical roles. `
            ]
        },
        CONC: {
            starters: [
                `Looking back at this module, my understanding of ${subject} has matured significantly. `,
                `This session marks a turning point in how I approach problem-solving within ${subject}. `,
                `If I had to summarize my growth in one sentence, it would be that ${topic} taught me to think systematically. `,
                `I am finishing this section with a far more nuanced perspective on ${topic} than when I started. `,
                `This deep dive into ${subject} has reaffirmed my passion for this specific area of engineering. `
            ],
            fillers: [
                `I am walking away from this class with a toolkit of concepts that will serve me for years. `,
                `The journey from confusion to confidence is exactly what higher education should feel like. `,
                `I am now eager to tackle the next module, armed with a much stronger foundation in ${subject}. `,
                `Reflecting on my progress, I realize that ${topic} is a cornerstone of my professional development. `,
                `I feel a renewed sense of purpose and clarity regarding my long-term academic goals. `
            ]
        }
    };

    const pool = pools[tag] || pools.EXP;
    let text = r(pool.starters) + r(pool.fillers);

    // 📝 NATURAL BULLET POINT INJECTOR (Weighted & Varied)
    const weights = { LEARN: 0.7, APP: 0.7, EXP: 0.4, FEEL: 0.2, CONC: 0.1 };
    const threshold = weights[tag] || 0.4;

    if (Math.random() < threshold) { 
        const points = [
            `Deep dive into the underlying mechanics of ${topic}.`,
            `Connecting ${subject} theory to real-world engineering hurdles.`,
            `Evaluating the scalability and efficiency of ${topic} in production.`,
            `Collaborative insights gained from group discussions during class.`,
            `Synthesizing ${topic} with my existing knowledge of ${subject}.`,
            `Formulating a plan to experiment with ${topic} in a lab setting.`,
            `Identifying potential bottlenecks when implementing ${topic} at scale.`,
            `Exploring the historical context that led to the development of ${subject}.`,
            `Analyzing the relationship between ${topic} and other core modules.`,
            `Documenting the technical constraints encountered during the ${topic} demo.`,
            `Refining my understanding of ${subject} through peer feedback.`,
            `Mapping out the dependencies between ${topic} and system architecture.`
        ];
        
        const count = Math.floor(Math.random() * 4) + 2; // 2 to 5 points
        const selected = shuffle(points).slice(0, count);
        
        const headers = ["Key Takeaways:", "Core Concepts:", "Technical Observations:", "Practical Insights:", "My Notes:", ""];
        const header = r(headers);
        const bulletStyles = ["• ", "– ", "  - ", "➤ "];
        const style = r(bulletStyles);
        
        const bulletText = (header ? `\n\n${header}\n` : "\n\n") + selected.map(p => style + p).join("\n") + "\n\n";
        
        // Randomly decide to append or prepend or mix (mostly append for natural flow)
        if (Math.random() > 0.8) {
            text = bulletText + text;
        } else {
            text += bulletText;
        }
    }

    // 🚀 RICH PADDING POOL (30+ unique sentences to prevent repetition)
    const extraPool = shuffle([
        `Furthermore, the methodology behind ${topic} is surprisingly elegant when you break it down step by step. `,
        `I spent extra time after class reviewing ${topic} documentation to reinforce what was taught. `,
        `The connection between ${topic} and professional software engineering was a recurring theme in the discussion. `,
        `It became clear that ${topic} is not just an academic exercise but a skill that employers actively seek. `,
        `The collaborative atmosphere of the class made it easier to digest the complexity of ${topic}. `,
        `I realized that my earlier misconceptions about ${subject} were holding me back from a deeper understanding. `,
        `The professor emphasized that ${topic} is foundational to almost everything we will do in this field. `,
        `We looked at several case studies where ${topic} was the difference between success and failure. `,
        `I found it fascinating how ${subject} principles can be applied to diverse domains. `,
        `The lecture touched on the ethical considerations of using ${topic} in sensitive data environments. `,
        `I noticed that my peers were also struggling with ${topic} at first, which made me feel better. `,
        `We compared ${topic} with alternative approaches and discussed the pros and cons of each. `,
        `The visual aids used in the class really helped in visualizing the flow of ${topic}. `,
        `I've decided to dedicate more study hours to ${subject} to ensure I don't fall behind. `,
        `It's impressive how ${topic} can simplify what used to be a very manual and tedious process. `,
        `The discussion on ${topic} optimization strategies was particularly enlightening for me. `,
        `I plan to revisit the lecture notes on ${subject} to clear up some minor doubts. `,
        `The interactive nature of the session allowed me to ask specific questions about ${topic}. `,
        `I am starting to see how ${topic} fits into the larger puzzle of my engineering degree. `,
        `The sheer versatility of ${subject} as a discipline is something I am only now beginning to appreciate. `,
        `I took detailed notes on the specific implementation details of ${topic} mentioned today. `,
        `The session concluded with a look at future trends in ${subject}, which was very inspiring. `,
        `I feel like I have crossed a significant threshold in my understanding of ${topic}. `,
        `The real-world examples provided by the professor bridged the gap between theory and practice. `,
        `I am looking forward to the lab session where we can implement ${topic} ourselves. `,
        `Understanding the limitations of ${topic} is just as important as knowing its strengths. `,
        `I've found that ${subject} requires a different way of thinking compared to my other classes. `,
        `The clarity of the lecture made even the most difficult parts of ${topic} accessible. `,
        `I'm going to try to explain ${topic} to a classmate to test my own understanding. `,
        `The session reminded me why I chose to study ${subject} in the first place. `
    ]);

    let extraIdx = 0;
    while (text.split(/\s+/).length < 480 && extraIdx < extraPool.length) {
        text += extraPool[extraIdx];
        extraIdx++;
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
const MAX_VARIATIONS = 20; // 20^5 = 3.2 million unique journal combinations
let poolCreatedAt = Date.now();
const POOL_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

// 🔄 Auto-refresh: wipe pool every 24 hours so users get fresh AI content daily
function checkPoolExpiry() {
    if (Date.now() - poolCreatedAt > POOL_LIFETIME_MS) {
        console.log(`[POOL] 🔄 24-hour expiry reached. Clearing ${variationPool.size} cached keys for fresh content.`);
        variationPool.clear();
        poolCreatedAt = Date.now();
    }
}

// 🔒 Section-specific prompt descriptions
const SECTION_PROMPTS = {
    EXP: "Describe your classroom EXPERIENCE. What topics were discussed? What did the professor explain? What examples were given? Write as if describing the class to a friend.",
    FEEL: "Share your EMOTIONAL REACTIONS during the class. How did you feel? Were you confused, excited, nervous? Did your mood change during the lecture? Be honest and personal.",
    LEARN: "Highlight the KEY INSIGHTS you gained. What concepts clicked? What did you understand for the first time? Explain the technical knowledge you now have. You may include a few bullet points.",
    APP: "Describe how you will APPLY this knowledge in real life, projects, or your career. Give specific examples of where this theory is useful. You may include a few bullet points.",
    CONC: "Write a CONCLUSION reflecting on your overall growth. How has your thinking changed? What is the most memorable takeaway? Look forward to the next challenge."
};

app.post("/api/generate-section", async (req, res) => {
    checkPoolExpiry(); // 🔄 Wipe pool if 24 hours have passed
    let resultSent = false;
    try {
        const { subject, topic, sectionTag, moduleRoman, syllabus, styleInstruction } = req.body;
        const isAssignment = sectionTag === "ASSIGNMENT";
        
        // Include topic in poolKey for assignments so each question caches independently
        const baseKey = isAssignment ? `${subject}_${moduleRoman}_${sectionTag}_${topic.substring(0, 30)}` : `${subject}_${moduleRoman}_${sectionTag}`;
        const poolKey = baseKey.toLowerCase().replace(/\s+/g, '_');

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
        const targetWordCount = isAssignment ? 2000 : 425;
        const variationNumber = existingPool.length + 1;

        let systemContent = undefined;
        let prompt;

        if (isAssignment) {
            systemContent = "You are an expert academic writer and professor creating an answer key for a university assignment. Write highly detailed, factually accurate, and structured academic content in third-person professional language. Under NO circumstances should you use words like 'I learned', 'I felt', 'The professor explained', or 'In this session'. This is NOT a reflective journal. It is a formal assignment answer.";
            
            // Force unique structural approaches based on variation
            let structuralInstruction = "";
            if (variationNumber === 1) structuralInstruction = "Start with a direct academic definition, followed by chronological stages/types, and end with real-world examples.";
            else if (variationNumber === 2) structuralInstruction = "Start with the historical context or core problem, explain the theoretical mechanism, and conclude with significance.";
            else if (variationNumber === 3) structuralInstruction = "Begin with the broader environmental/cultural impact, break down the specific components, and end with preventive/conservation measures.";
            else structuralInstruction = "Use a unique academic structural approach, ensuring no repetition from generic templates.";

            prompt = `
Write a massively detailed, university-level essay answer for the following assignment question.
This is VARIATION #${variationNumber} — you must ensure the paragraph structure, phrasing, and examples are completely distinct from other variations.

SUBJECT: ${subject}
ASSIGNMENT/MODULE: ${moduleRoman}
QUESTION: ${topic}

CRITICAL INSTRUCTIONS (MUST FOLLOW):
1. MANDATORY LENGTH: You MUST write a MINIMUM of 2000 words. If you write less than 2000 words, you will fail. 
2. MANDATORY STRUCTURE: You MUST write exactly 15 to 20 extremely long paragraphs. Each paragraph MUST be highly detailed and at least 150 words long. Do NOT write short paragraphs.
3. Content Expansion: To reach the word count, you must provide extensive historical background, deep theoretical breakdowns, multiple comprehensive real-world case studies, and a massive, thoughtful conclusion. Expand on every single tiny detail.
4. FORMATTING (STRICTLY ENFORCED): You are completely FORBIDDEN from using bullet points, numbered lists, hyphens for lists, or any point-form text. You MUST write EXCLUSIVELY in long, continuous, flowing academic paragraphs.
5. DO NOT use generic section headers like "Here is the answer" or "My Notes:".
6. DO NOT use first-person pronouns ("I", "we", "my") or reflective phrases ("I understood").
7. Begin the answer immediately without any introductory filler and DO NOT STOP until you have written at least 15 massive paragraphs.
            `;
        } else {
            const sectionGuide = SECTION_PROMPTS[sectionTag] || SECTION_PROMPTS.EXP;
            prompt = `
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
- You MAY include 2-4 bullet points in this section if it feels natural to highlight key insights, or you can skip them entirely to keep the flow conversational.
- DO NOT repeat the same opening phrase as other sections.
- DO NOT use markdown formatting like ** or ##.
- This is variation ${variationNumber} of ${MAX_VARIATIONS}. Make the opening line UNIQUE.
            `;
        }

        console.log(`[POOL] 🤖 Generating variation #${variationNumber} for ${poolKey}`);
        let text = "";
        try {
            text = await generateWithAI(prompt, systemContent);
            
            // If the AI generated less than 400 words, we ask it to expand once.
            if (isAssignment && text.split(/\\s+/).length < 400) {
                console.log(`[POOL] 🤖 Assignment answer too short (${text.split(/\\s+/).length} words). Expanding...`);
                const continuePrompt = `
You previously started answering a question about ${topic}. The answer is currently too short.
Here is what you wrote:

${text}

CRITICAL INSTRUCTION: Continue the answer exactly where you left off, adding at least 250 more words. Do NOT use any bullet points or lists. Write exclusively in long, detailed paragraphs providing academic depth and examples.`;
                const additionalText = await generateWithAI(continuePrompt, systemContent);
                text += "\\n\\n" + additionalText.replace(/^(Sure|Here is|Continuing).*?\\n/gi, "").trim();
            }

        } catch (aiErr) {
            console.log(`[POOL] ⚠️ AI failed, using fallback for ${sectionTag}`);
            text = getDynamicFallback(sectionTag, subject, topic);
        }

        // Minimum length guard (We just pad slightly if it's completely broken)
        const minWords = isAssignment ? 400 : 300;
        if (text.split(/\\s+/).length < minWords) {
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

/* =========================================================
   📝 TERM 4 ASSIGNMENT FALLBACK DATABASE & ENDPOINTS
   ========================================================= */

const assignmentFallbackDb = {
        "ecosystem": `So basically, an ecosystem is like a community where living things and non-living things interact. It has two main parts:
- Biotic: The living stuff like plants (producers), animals (consumers), and fungi (decomposers).
- Abiotic: The non-living stuff like sunlight, water, and soil.
The whole point of an ecosystem is to keep energy flowing and recycle nutrients so everything stays in balance.`,
        "ecological balance": `Ecological balance is pretty much when everything in an environment is stable. The species, resources, and habitats are all in a state of equilibrium. It's super important because:
- It keeps the food chain working smoothly.
- It prevents any one species from overpopulating and ruining resources.
When we do things like deforestation or pollution, it messes up this balance, which can lead to species dying out and major climate issues.`,
        "food chain": `A food chain is just the path of energy transfer when one organism eats another. A classic example is:
- Grass gets energy from the sun (Producer).
- A grasshopper eats the grass (Primary consumer).
- A frog eats the grasshopper (Secondary consumer).
- A snake eats the frog, and a hawk eats the snake.
The catch is that only about 10% of the energy moves to the next level, so the animals at the top get way less energy.`,
        "trophic levels": `Trophic levels are basically the steps in a food chain that show how organisms get their energy. 
- 1st Level: Producers (like plants) that make their own food.
- 2nd Level: Primary consumers (herbivores) that eat the plants.
- 3rd & 4th Levels: Secondary and tertiary consumers (carnivores) that eat other animals.
Because a lot of energy is lost as heat at each step (the 10% rule), there are usually only 4 or 5 levels in total.`,
        "ecological pyramids": `Ecological pyramids are just graphs that show the relationship between different trophic levels. There are three main types:
- Pyramid of Numbers: Shows how many individual organisms are at each level.
- Pyramid of Biomass: Shows the total dry weight of organisms.
- Pyramid of Energy: Shows how much energy flows through each level.
While numbers and biomass pyramids can sometimes be inverted (like a single tree supporting lots of bugs), the energy pyramid is always upright.`,
        "pyramid of energy": `The pyramid of energy is a graph showing how energy flows through a food chain over time. The most important thing about it is that it's ALWAYS upright. 
This is because of the laws of thermodynamics: every time an animal eats something, about 90% of the energy is lost as heat or used for basic survival, and only 10% is passed on to the next level. So, producers at the bottom always have the most energy.`,
        "carbon cycle": `The carbon cycle is how carbon moves around the Earth. It's super important for life. 
- Plants absorb CO2 from the air for photosynthesis.
- Animals eat the plants, and then breathe out CO2 (respiration).
- When plants and animals die, decomposers break them down, releasing carbon back into the soil and air.
Over millions of years, some carbon turns into fossil fuels. Burning these fuels is what's messing up the cycle right now and causing global warming.`,
        "nitrogen cycle": `The nitrogen cycle is how nitrogen gets converted into usable forms for living things. Even though the air is 78% nitrogen, we can't use it directly. 
- Nitrogen Fixation: Bacteria in the soil turn nitrogen gas into ammonia.
- Nitrification: Other bacteria turn ammonia into nitrates, which plants can absorb.
- Assimilation: Plants and animals use the nitrates to build proteins.
- Denitrification: Finally, bacteria break down waste and release nitrogen gas back into the air.`,
        "greenhouse effect": `The greenhouse effect is basically how the Earth traps the sun's heat. 
- Sunlight comes in and warms the surface.
- The Earth radiates heat back out.
- Greenhouse gases in the atmosphere (like CO2, methane, and water vapor) trap some of this heat, keeping the planet warm.
Naturally, this is a good thing because it keeps us from freezing. But human activities like burning fossil fuels are trapping too much heat, causing climate change.`,
        "ozone layer depletion": `Ozone layer depletion is the thinning of the Earth's ozone layer, which sits up in the stratosphere and blocks harmful UV rays from the sun.
It's mainly caused by chemicals called CFCs (chlorofluorocarbons) that used to be in old fridges and aerosol sprays. When CFCs reach the atmosphere, UV light breaks them down, releasing chlorine that destroys ozone molecules. Luckily, after we banned CFCs, the ozone hole has actually started to heal!`,
        "air pollution, its sources": `Air pollution is when harmful stuff gets into the air and messes with human health and the environment. 
- Anthropogenic (human-made) sources: Exhaust from cars, smoke from factories, burning fossil fuels, and agricultural chemicals.
- Natural sources: Volcanic eruptions, forest fires, and dust storms.
Breathing this polluted air causes major respiratory issues, heart disease, and contributes to bigger problems like acid rain.`,
        "air pollution control devices": `These are technologies used in factories and cars to clean up emissions before they hit the air. Some common ones include:
- Electrostatic Precipitators: Use static electricity to trap dust and smoke particles.
- Fabric Filters (Baghouses): Basically act like giant vacuum bags to catch dust.
- Wet Scrubbers: Use liquid sprays to wash pollutants out of the gas.
- Catalytic Converters: Used in cars to turn toxic gases into harmless water vapor and CO2.`,
        "noise pollution": `Noise pollution is basically just excessive or disturbing sound that messes with our well-being. It becomes harmful when it crosses around 75-80 decibels.
- Sources: Traffic, construction, loud speakers, and industrial machines.
- Effects: It can cause hearing loss, sleep disruption, stress, and even high blood pressure. It also really messes up wildlife by interfering with their communication and driving them away from their habitats.`,
        "noise measured": `Noise is measured in decibels (dB) using a Sound Level Meter. Prevention and control usually happen in three ways:
- At the source: Lubricating machines or using silencers.
- In the transmission path: Building sound barriers, planting dense trees, or using double-glazed windows to block the sound.
- At the receiver: Making workers wear earplugs or earmuffs in loud areas.`,
        "noise pollution rules": `In India, noise pollution is regulated under the Environment Protection Act. The rules set specific decibel limits depending on the zone and time of day:
- Industrial zones: 75 dB (day), 70 dB (night)
- Commercial: 65 dB (day), 55 dB (night)
- Residential: 55 dB (day), 45 dB (night)
They also define strict 'Silence Zones' around hospitals and schools where loud noises and honking are totally banned.`,
        "water pollution": `Water pollution is when water bodies get contaminated, making the water unsafe. 
- Point source: Pollution coming from one specific place, like a factory pipe dumping waste.
- Non-point source: Runoff from city streets or farm fields carrying fertilizers.
The pollutants can be chemicals, sewage, or heavy metals. It causes diseases, ruins aquatic ecosystems, and leads to eutrophication (where algae blooms steal all the oxygen in the water).`,
        "surface water": `Surface water pollution affects rivers and lakes, usually from sewage, factory waste, and farm runoff. It spreads fast but can sometimes be cleaned naturally through aeration. 
Groundwater pollution happens when chemicals (like pesticides or leaking underground tanks) seep into the soil and reach the aquifers below. Groundwater moves super slowly and has no sunlight, so once it's polluted, it's incredibly difficult and expensive to clean up.`,
        "water quality parameters": `We use several parameters to check if water is safe:
- pH: Measures acidity (6.5 to 8.5 is normal).
- Turbidity: How cloudy the water is from suspended dirt.
- Total Suspended Solids (TSS): Solid particles that block sunlight in the water.
- BOD (Biochemical Oxygen Demand): Measures how much oxygen bacteria need to break down organic waste. High BOD means high pollution.
- COD: Measures total organic chemicals present.`,
        "stages of wastewater treatment": `Wastewater treatment cleans up sewage before releasing it back into nature. It happens in three main stages:
- Preliminary & Primary: Physical steps. Uses screens to catch large trash, and settling tanks where sludge sinks to the bottom.
- Secondary: Biological step. Uses bacteria and air to consume and break down the dissolved organic waste.
- Tertiary: Advanced chemical step. Filters the water, removes nutrients like phosphorus, and disinfects it using UV or chlorine.`,
        "primary, secondary, and tertiary": `Here's the breakdown of the wastewater treatment phases:
- Primary: Purely physical. It uses gravity and screens to separate floating trash and heavy sludge. Doesn't remove dissolved chemicals.
- Secondary: Biological. Bacteria are added into aerated tanks to literally eat the dissolved organic matter and clean the water naturally.
- Tertiary: The final polish. Uses advanced filtration and chemicals to remove remaining salts, nitrogen, and kills pathogens, making the water safe for reuse.`,
        "soil pollution": `Soil pollution is when toxic chemicals contaminate the land, ruining agriculture and poisoning groundwater. 
- Causes: Overusing chemical fertilizers/pesticides, dumping industrial waste, and garbage landfills.
- Effects: Heavy metals like lead and arsenic get absorbed by crops and eventually end up in our food, causing serious health issues.
- Solutions: Switching to organic farming, proper waste disposal, and using plants/microbes to absorb toxins from the soil (bioremediation).`,
        "solar energy": `Solar energy is just harnessing power from the sun, and it's our most abundant renewable resource.
- How it works: Photovoltaic (PV) cells in solar panels convert sunlight directly into electricity.
- Benefits: It’s completely carbon-free, reduces pollution, and lowers electricity bills.
- Challenges: It only works when the sun is shining, so we need really good batteries to store the power for nighttime or cloudy days.`,
        "biomass energy": `Biomass energy comes from organic waste like plants, cow dung, and sewage. It's carbon-neutral because the CO2 it releases was absorbed by the plants while they were growing.
One major way to use it is Biogas production: bacteria break down the waste in an oxygen-free tank (anaerobic digestion) to produce methane gas. We can use this gas for cooking or generating electricity, and the leftover sludge is an amazing organic fertilizer.`,
        "wind energy": `Wind energy uses large turbines to convert the wind's kinetic energy into electricity. 
- How it works: The wind spins the aerodynamic blades, which turns a generator inside the turbine.
- Benefits: It produces zero emissions and the land around the turbines can still be used for farming.
- Challenges: Wind speeds are unpredictable, the turbines can be noisy, and they sometimes pose a hazard to local bird populations.`,
        "hydrogen energy": `Hydrogen energy is a super clean fuel that only produces water vapor when burned or used in a fuel cell. 
- Green Hydrogen is the best kind, made by splitting water using renewable electricity.
- In a fuel cell, hydrogen mixes with oxygen to create an electric current.
It’s a huge deal for the future of transportation (like trucks and ships) and heavy industry, but it's currently hard to store safely because it requires high pressure.`,
        "tidal energy": `Tidal and ocean energy use the movement of the sea to generate power. 
- Tidal energy relies on the moon's gravity causing tides. We build underwater turbines or barrages (like dams) that spin as the tide goes in and out.
- Ocean Thermal energy uses the temperature difference between warm surface water and cold deep water.
It's great because tides are 100% predictable, but the equipment is expensive to build and salt water is really corrosive.`,
        "geothermal energy": `Geothermal energy taps into the natural heat trapped deep inside the Earth's core.
We drill deep wells to reach underground reservoirs of steam and hot water, which are then used to spin turbines and generate electricity. 
It’s highly reliable because, unlike solar or wind, the Earth’s heat is constantly available 24/7. However, it can only be built in specific areas with high volcanic or tectonic activity.`,
        "environmental benefits": `Switching to alternative energy (like solar, wind, and hydro) has massive environmental benefits:
- It drastically cuts down greenhouse gas emissions, which is our best shot at stopping global warming.
- It basically eliminates air pollution from burning coal, meaning less respiratory diseases.
- It saves huge amounts of fresh water since wind and solar don't need water for cooling like traditional power plants do.`,
        "e-waste management": `E-waste is discarded electronics like old phones and laptops. It’s highly toxic because it contains heavy metals like lead and mercury.
We manage it using the 3R principles:
- Reduce: Build electronics that last longer and are easier to fix.
- Reuse: Donate or refurbish old devices instead of throwing them away.
- Recycle: Safely extract valuable metals (like gold and copper) from the circuit boards so we don't have to mine as much.`,
        "environmental legislation": `Environmental legislation refers to the laws governments make to protect nature and control pollution. 
In India, we have the Environment Protection Act, which gives the government power to regulate factory emissions and hazardous waste. 
Globally, companies follow ISO 14000 standards, which act as a framework to help them reduce their carbon footprint, manage waste responsibly, and prove they are environmentally friendly.`,
        "sanchi stupa": `The Sanchi Stupa in Madhya Pradesh is an amazing piece of ancient Buddhist architecture built by Emperor Ashoka. 
- Structure: It’s a huge stone dome that represents the universe, with umbrellas on top symbolizing the Buddha, Dharma, and Sangha.
- Gateways (Toranas): The coolest part are the four carved stone gateways that tell stories of the Buddha’s past lives (Jataka tales) in incredible detail.`,
        "ajanta caves": `The Ajanta Caves in Maharashtra are ancient rock-cut Buddhist monasteries carved straight into a cliffside.
They are world-famous for their mural paintings. The artists used a tempera technique on mud plaster to paint scenes from the Buddha's life. The art is super expressive and detailed, making it one of the finest surviving examples of classical Indian painting.`,
        "konark sun temple": `The Konark Sun Temple in Odisha is an architectural masterpiece designed to look like a massive stone chariot for the Sun God, Surya. 
- It has 24 intricately carved wheels pulled by seven horses.
- The engineering is mind-blowing: the wheels actually work as precise sundials that can tell the time down to the minute. 
It's a perfect blend of ancient art, astronomy, and structural physics.`,
        "taj mahal": `The Taj Mahal is pretty much the ultimate symbol of Indo-Islamic architecture, built by Emperor Shah Jahan for his wife Mumtaz Mahal.
It's famous for its absolute perfect symmetry and the pure white marble that changes color with the sunlight. The walls are decorated with 'pietra dura', which is a technique where semi-precious stones are inlaid into the marble to create beautiful floral patterns.`,
        "mahabalipuram": `Mahabalipuram and the Red Fort show the two extremes of Indian engineering.
- Mahabalipuram (ancient): Features incredible monolithic rock-cut temples carved out of single granite boulders right on the coast, showing early mastery of stone carving.
- Red Fort (medieval): A massive red sandstone palace complex built by Shah Jahan, famous for its sophisticated defensive walls and an advanced water cooling system that ran through the palace.`,
        "indian festivals": `Indian festivals are basically living museums that help preserve our cultural traditions. 
Whether it's Diwali, Holi, or Eid, these festivals bring communities together. They aren't just for fun—they pass down mythology, traditional food, and clothing to the younger generation. They also teach core values like charity and gratitude, while boosting local businesses and artisans.`,
        "rituals and customs": `Rituals and customs are the glue that holds Indian society together. 
From birth to death, there are specific rites of passage (Sanskaras) that guide people through life. These customs encourage people to prioritize family, respect elders, and live in harmony with nature. Even as society modernizes, these traditions provide a sense of stability and connection to our ancestors.`,
        "regional traditions": `Regional traditions are what make India so uniquely diverse. 
Every state has its own language, dance, music, and food. For example, you have Bhangra in Punjab and Carnatic music in the South. Instead of dividing us, this diversity actually brings people together through cultural exchange, making India a vibrant mosaic rather than just a boring melting pot.`,
        "seasonal festivals": `Seasonal festivals in India are deeply tied to agriculture and the changing of the seasons. 
For example, harvest festivals like Makar Sankranti, Pongal, and Bihu celebrate the transition of the sun and the gathering of crops. People fly kites, light bonfires, and feast on the new harvest. They show how closely traditional Indian life is connected to nature's rhythms.`,
        "unity, harmony": `Festivals in India are a huge driver for unity and social harmony. 
During major festivals, people from different religious backgrounds often come together, exchange sweets, and celebrate as a community. Traditions like the 'Langar' in Sikhism, where everyone sits and eats together regardless of their background, perfectly show how our culture promotes equality and mutual respect.`,
        "c. v. raman": `Sir C. V. Raman was a legendary Indian physicist who put India on the global science map. 
He won the Nobel Prize in Physics in 1930 for discovering the 'Raman Effect', which is basically how light scatters and changes energy when it passes through a transparent material. This discovery is still widely used today in chemistry and medicine to figure out the molecular structure of materials.`,
        "abdul kalam": `Dr. A. P. J. Abdul Kalam, known as the 'Missile Man of India', was a brilliant scientist and one of our most beloved Presidents. 
He played a massive role in building India's space program at ISRO and developed our strategic missile systems at DRDO. Beyond his scientific genius, he constantly inspired students to dream big and use technology to develop the country.`,
        "modern science": `After independence, India focused heavily on modern science to build a self-reliant nation. 
Leaders set up premier institutes like the IITs and ISRO. This led to massive successes like the Green Revolution (which solved food shortages), our booming IT sector, and incredible space missions like Chandrayaan and Mangalyaan, showing the world that India is a serious technological powerhouse.`,
        "bridges the gap": `Modern Indian science does a great job of bridging the gap between our ancient traditions and new innovations. 
We don't just throw away old knowledge. For example, researchers use modern chemistry to study ancient Ayurvedic herbs, creating evidence-based medicines. We also combine traditional organic farming techniques with modern biotechnology, proving that tradition and innovation can work hand-in-hand.`,
        "physics, space research": `Physics, space research, and nuclear science have completely transformed modern India. 
- ISRO's satellite networks are crucial for our telecommunications, weather forecasting, and disaster management.
- Our nuclear program, started by Homi Bhabha, is working on using our vast thorium reserves to generate clean energy.
Investing in these frontier sciences has driven economic growth and secured our national infrastructure.`,
        "traditional indian crafts": `Traditional Indian crafts are amazing reflections of our heritage, with skills passed down for generations. 
- Pottery: Ranges from simple clay pots to the beautiful glazed Blue Pottery of Jaipur.
- Woodcraft: Includes delicate walnut carvings from Kashmir.
- Bidriware: A cool metalcraft from Karnataka where pure silver wire is inlaid into blackened metal.
These crafts are crucial because they provide livelihoods for millions of rural artisans.`,
        "handloom traditions": `India’s handloom textiles are world-famous for their quality and intricate designs. 
- Banarasi Silk: Known for its heavy gold and silver brocade work.
- Pashmina: Super soft and warm shawls made from Himalayan goat wool.
- Kanchipuram: South Indian saris famous for their heavy silk and contrasting borders.
These aren't just clothes; they represent regional identities and are protected by Geographical Indications (GI) tags.`,
        "folk art": `Folk art in India is how communities recorded their stories and beliefs before formal writing was common. 
- Madhubani: Colorful, nature-inspired art painted on mud walls in Bihar.
- Warli: Tribal art from Maharashtra that uses simple geometric white shapes on brown clay to show daily life.
- Kalamkari: Hand-painted textiles using natural vegetable dyes.
These arts preserve our oral folklore and community memories beautifully.`,
        "stone carvings": `Stone carving is an ancient Indian art form where craftsmen turned solid rocks into stunning sculptures and temples. 
Using ancient design manuals (Shilpa Shastras), they mastered how to cut and balance stone. You can see this mastery in places like Ellora, Khajuraho, and Mahabalipuram, where hard granite was carved with incredible emotional depth and delicate details.`,
        "cultural identity": `Traditional crafts and folk arts are a huge part of India's cultural identity and soft power. 
In a world where everything is mass-produced in factories, our handmade goods celebrate individual creativity and regional heritage. When these crafts are showcased globally, it builds respect for Indian culture and provides sustainable jobs for rural communities, keeping the traditions alive.`,
        "holistic healthcare": `Holistic healthcare in India doesn't just look at physical symptoms; it treats the mind, body, and spirit together. 
This is the core of systems like Ayurveda, Yoga, Siddha, and Unani (AYUSH). For example, Ayurveda focuses on balancing the body's 'Doshas' through diet and herbs, while Yoga unites physical movement with mental focus. It’s all about preventive care and living in harmony with nature.`,
        "ashtanga yoga": `Ashtanga Yoga is an eight-step path to physical and mental wellness, originally laid out by the sage Patanjali. 
It includes moral restraints (Yamas), physical postures (Asanas) for strength, and breath control (Pranayama) to regulate stress. The final stages focus on deep meditation. Today, it’s widely recognized as an amazing way to manage anxiety, build resilience, and improve overall cardiovascular health.`,
        "cultural diversity": `Cultural diversity in India is often described as 'Unity in Diversity'. 
We have over 22 official languages, completely different clothing styles depending on the region, and hugely varied cuisines. Yet, despite all these differences, a shared history and mutual tolerance bind everyone together. It’s a beautiful mosaic where everyone keeps their unique identity while contributing to the whole nation.`,
        "preserving indian": `Preserving India's cultural heritage is super important for keeping our identity alive. 
This includes physical monuments and intangible things like folk music and traditional healthcare. Organizations like the ASI and UNESCO help protect these sites. It’s not just about looking at the past—heritage conservation brings in tourism revenue, creates jobs, and teaches us ancient sustainable practices that are still useful today.`,
        "healthcare systems": `Traditional healthcare systems (like Yoga and Ayurveda) and our cultural heritage are massive boosters for India's global identity. 
Because modern life is so stressful, the whole world is turning to Indian wellness concepts—like the International Day of Yoga, which is now celebrated globally. By combining our heritage tourism with wellness retreats, India has become a leading global hub for holistic health and sustainable living.`
    };

function getDynamicAssignmentFallback(subject, question) {
    const lowerQ = question.toLowerCase();
    let matchedText = "";
    
    // Find matching key in database
    for (const key in assignmentFallbackDb) {
        if (lowerQ.includes(key)) {
            matchedText = assignmentFallbackDb[key];
            break;
        }
    }
    
    // Default fallback if no keyword matches
    if (!matchedText) {
        matchedText = `This assignment analysis evaluates ${question.replace(/[?.]/g, '')} within the curriculum of ${subject}. The topic represents a crucial milestone in our academic understanding of the field, highlighting the structural, theoretical, and practical applications of this knowledge. By analyzing the core mechanisms involved, we can appreciate the design considerations and methodologies that govern the system. For instance, when implementing these concepts, it is essential to consider the trade-offs between efficiency and reliability, which are key priorities in the industry today.`;
    }
    
    return matchedText;
}
app.get("/", (req, res) => res.send("QuickJournal Engine Active 🚀"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));