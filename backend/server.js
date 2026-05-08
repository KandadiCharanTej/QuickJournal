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
// (Cache is now defined at the top of the file for persistence)
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
                        max_tokens: 1500,
                        temperature: 0.9
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
You are a highly articulate university scholar writing the ${sec.name} section of a deep reflective journal.
Subject: ${subject} | Module: ${moduleRoman} | Topic: ${topic}

INSTRUCTIONS:
${sec.focus} ${sec.desc}
- You MUST write a MINIMUM of 450 words. Do NOT stop writing early. If you write less than 450 words, you fail.
- To reach this length, you must extensively describe 3 specific real-world examples, 2 theoretical breakdowns, and your deep personal analysis.
- Write everything as ONE massive, unbroken paragraph.
- NO headings, NO bullet points, NO names.
- Variation ID: ${variation}
`;

        let text = await generateWithAI(prompt);
        
        // Force the AI to expand if it's too short (under 200 words)
        if (text.split(" ").length < 200) {
            console.log("AI response too short, retrying for longer text...");
            text = await generateWithAI(prompt + "\n\nCRITICAL: Your previous attempt was too short. You MUST double the length and write at least 450 words this time.");
        }
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
            "EXP": `The classroom experience covering ${req.body.topic || 'this topic'} was an incredibly deep and comprehensive session that completely transformed my understanding of the subject. From the very beginning of the lecture, the professor ensured that the foundational concepts were laid out with absolute clarity. We started by exploring the theoretical framework that underpins the entire topic, discussing not just how these systems work, but the historical context and the core problems they were designed to solve. As the session progressed, the theoretical concepts were systematically broken down into highly detailed, practical examples. The professor utilized excellent visual aids, diagrams, and real-time demonstrations on the board, which served as powerful analogies for complex mechanisms. I made sure to actively take notes, capturing not only the definitions and formulas but also the nuanced explanations of edge cases and exceptions. The interactive nature of the class was a significant highlight; whenever a complex sub-topic was introduced, the professor paused to engage the class, asking probing questions that forced us to think critically rather than just passively absorb information. This pedagogical approach maintained my complete focus throughout the entire duration of the lecture. One of the most effective parts of the experience was the collaborative discussion towards the end, where we analyzed real-world scenarios and industry-standard applications. The pacing of the class was meticulously balanced—fast enough to cover a vast amount of critical material, yet slow enough to ensure that the more difficult and abstract concepts were fully digested by the students. I found myself frequently nodding along as previously fragmented pieces of knowledge from previous classes finally started to connect into a cohesive mental model. Overall, this specific classroom session was highly engaging, exceptionally informative, and perfectly structured to maximize our retention and understanding of the material.`,
            "FEEL": `Reflecting on my emotional journey throughout this lecture, I experienced a significant and positive shift in my overall confidence regarding this subject material. Initially, when the topic was first introduced, I felt a distinct sense of apprehension mixed with curiosity. The sheer volume of new terminology, complex architectures, and advanced theories seemed overwhelming, and I was genuinely concerned about my ability to keep pace with the discussion. I felt moments of slight confusion as the professor dove into the more abstract layers of the topic, causing me to question my foundational knowledge. However, this anxiety was short-lived. As the lecture progressed and the professor seamlessly transitioned from abstract theory into concrete, relatable examples, my initial confusion began to rapidly dissolve. I felt a surge of intellectual excitement and genuine intrigue as the practical applications of these theoretical concepts were revealed. I found myself becoming highly invested in the logical flow of the arguments being presented. When the professor walked us through the step-by-step problem-solving process, I experienced several 'aha!' moments that replaced my self-doubt with a profound sense of clarity and empowerment. I felt deeply satisfied when I was able to correctly anticipate the next step in the examples before it was explicitly stated. By the conclusion of the session, my emotional state had completely transformed from anxious uncertainty to enthusiastic confidence. I felt a strong sense of academic accomplishment in having successfully grasped such intricate material. This positive emotional shift has left me feeling highly motivated and eager to explore the subject further on my own time, completely replacing any prior trepidation with a genuine passion for the coursework.`,
            "LEARN": `The core learning outcomes from this session were extensive and deeply foundational for my ongoing academic progress. My primary takeaway was a robust, comprehensive understanding of the mechanics, rules, and underlying philosophy behind ${req.body.topic || 'this critical topic'}. I moved beyond mere rote memorization and truly internalized the fundamental principles that govern this area of study. I learned the specific syntax, structural requirements, and precise methodologies necessary to implement these ideas correctly and efficiently. More importantly, the analogies provided during the lecture illuminated the abstract concepts, making them highly concrete and logical. I now possess a deep understanding of not just the 'how', but the 'why'—why certain techniques are preferred over others, why specific rules exist, and how these individual components interact to form a larger, cohesive system. I also learned how to identify common pitfalls, errors, and inefficiencies that frequently occur when applying these concepts, which will save me countless hours of troubleshooting in the future. The lecture effectively bridged the gap between theoretical knowledge and practical execution. I am now capable of breaking down complex problems within this domain into manageable, sequential steps. This deep theoretical and practical understanding is absolutely crucial for my upcoming technical assessments, major projects, and laboratory work. Furthermore, I learned how this specific topic integrates with the broader themes of the entire course syllabus. This holistic understanding has significantly sharpened my analytical thinking and critical evaluation skills. I feel completely confident in my ability to explain these concepts to a peer, which is the ultimate test of true comprehension.`,
            "APP": `The practical application of this newly acquired knowledge is where I see the most immense value for my academic and professional future. I plan to aggressively apply these concepts directly in my upcoming major projects, assignments, and intensive practical lab sessions. Understanding ${req.body.topic || 'these core mechanisms'} is absolutely essential for architecting, building, and maintaining robust, scalable, and efficient systems in my future career. By mastering these principles at this stage, I am strategically laying an unshakeable foundation for the highly advanced topics I will encounter in subsequent semesters. My immediate plan of action is to start writing extensive practice programs, designing comprehensive diagrams, and simulating complex scenarios to pressure-test my understanding. I will intentionally create edge cases and challenging environments to see how these concepts hold up under stress, which will dramatically improve my troubleshooting and debugging skills. Furthermore, I recognize that the concepts covered today are not just academic exercises; they are industry-standard practices utilized by top professionals worldwide. By aligning my current academic work with these real-world applications, I am actively bridging the gap between being a student and becoming a competent, industry-ready professional. I will use this knowledge to optimize my existing projects, making them more efficient and structurally sound. In technical interviews and future professional roles, the ability to clearly articulate and practically apply these exact principles will be a significant competitive advantage. I am committed to continuously practicing these techniques until they become second nature, ensuring that I can rely on them instinctively when solving complex engineering problems in a real-world setting.`,
            "CONC": `In conclusion, this specific module and lecture session represented a monumental step forward in my overall academic journey and technical development. The intensive deep dive into this subject completely clarified numerous doubts and misconceptions I had previously held. It successfully connected several disparate dots from previous lectures, unifying them into a single, comprehensive framework of understanding. I now feel exceptionally well-prepared and highly motivated to tackle the significantly more complex and demanding challenges that lie ahead in this subject area. This profound learning experience has not only drastically improved my technical knowledge base and practical skill set, but it has also fundamentally refined my analytical, problem-solving mindset. I have learned to approach complex, intimidating problems with a structured, logical methodology rather than feeling overwhelmed. The combination of excellent pedagogical instruction, detailed practical examples, and my own active engagement resulted in a highly successful educational outcome. I will carry the insights, techniques, and confidence gained from this session forward into the remainder of the semester and ultimately into my professional career. The time and effort invested in mastering this specific topic will undoubtedly yield massive returns in my future academic performance and career trajectory. This session has perfectly exemplified the value of deep, focused academic study and has reignited my overarching passion for my chosen field of engineering.`
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