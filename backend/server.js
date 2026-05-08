require("dotenv").config();

console.log("-----------------------------------------");
console.log("QuickJournal Backend Starting...");
console.log("Node Version:", process.version);
console.log("API KEY 1:", process.env.GROQ_API_KEY_1 ? "PRESENT" : "MISSING");
console.log("-----------------------------------------");

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// 📂 IN-MEMORY CACHE (Safer for Serverless/PaaS like Render)
let cache = new Map();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

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
    const ip = req.ip;
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
            const fallbackTemplates = {
                "EXP": `The classroom experience centered around the discussion of the topic was an exceptionally profound and intellectually stimulating session that offered a comprehensive overview of the fundamental principles and advanced applications of the subject matter. From the very inception of the lecture, the atmosphere in the room was one of intense academic focus, as the professor meticulously laid the groundwork for the complex theories we were about to navigate. We began with a rigorous exploration of the historical and theoretical frameworks, dissecting the core problems that these methodologies were designed to address in a real-world engineering context. The pedagogical approach was remarkably effective, utilizing a blend of high-level theoretical discourse and grounded, practical demonstrations that served to bridge the gap between abstract concepts and tangible execution. I found myself deeply engaged as the lecture transitioned into a series of detailed case studies, where each component of the system was isolated and analyzed for its specific contribution to the overarching architecture. The use of sophisticated visual aids, including multi-layered diagrams and live technical demonstrations, provided a multi-dimensional perspective that made even the most intricate sub-topics accessible. I made a concerted effort to capture every nuance in my notes, documenting not only the primary formulas and definitions but also the critical edge cases and potential failure points that were highlighted throughout the discussion. The interactive elements of the session, such as the spontaneous Q&A segments and the collaborative problem-solving exercises, forced us to think critically and apply our knowledge in real-time. By the conclusion of the lecture, the previously disparate elements of the syllabus had begun to coalesce into a unified mental model, providing me with a sense of clarity and technical confidence that I had not previously possessed. This session was a masterclass in effective instruction, leaving me with a deep appreciation for the complexities involved and a strong desire to explore further reaches. This was followed by a deeper dive into the specific algorithms that govern the system's efficiency, where we spent a significant amount of time analyzing time complexity and space requirements in various deployment scenarios, ensuring that our theoretical understanding was firmly rooted in practical engineering constraints.`,
                "FEEL": `Reflecting upon my emotional and psychological journey during the course of this intensive lecture, I can identify a significant and highly positive transformation in my internal state, moving from a position of initial trepidation to one of profound intellectual empowerment. When the topic was first introduced, I must admit to feeling a distinct sense of academic anxiety, as the sheer scale and complexity of the material seemed, at first glance, to be almost insurmountable. The introduction of advanced terminology and abstract structural concepts initially triggered a feeling of cognitive overload, causing me to question the depth of my foundational preparation for such a rigorous module. However, as the professor began to systematically deconstruct these formidable concepts into more manageable, logical segments, my initial apprehension started to dissipate, replaced by a growing sense of curiosity and intellectual intrigue. I felt a genuine surge of excitement during the moments of conceptual breakthrough—those 'aha!' moments where the logic of the system finally clicked into place and the underlying elegance of the theory was revealed. These instances of clarity were incredibly rewarding, providing a much-needed boost to my academic self-esteem and reinforcing my passion for the subject. I found myself becoming increasingly invested in the logical progression of the lecture, experiencing a deep sense of satisfaction as I successfully anticipated the next steps in complex derivations. By the time the session reached its conclusion, the earlier feelings of uncertainty had been entirely supplanted by a robust sense of accomplishment and a heightened state of motivation. I left the classroom feeling not just informed, but genuinely inspired, possessing a newfound confidence in my ability to master even the most challenging aspects of the curriculum. This emotional shift has fundamentally altered my approach to the subject, turning what was once a source of stress into a source of genuine intellectual pleasure and academic pride.`,
                "LEARN": `The technical insights and conceptual breakthroughs achieved during this session have provided me with an exceptionally robust and multi-faceted understanding of the core mechanics that govern this critical area of study. My learning progressed far beyond the superficial layer of rote memorization, moving instead into a deep, internalized comprehension of the fundamental principles and the underlying logic that dictates how these systems operate in high-pressure, real-world environments. I gained a precise understanding of the structural requirements, the specific syntax, and the rigorous methodologies that are essential for the successful implementation of the concepts in a professional engineering context. One of the most significant aspects of my learning was the realization of the 'why' behind the 'how'—the strategic reasoning that informs the choice of one technique over another and the critical importance of adhering to industry-standard best practices. We explored the intricate relationship between various components, learning how small changes in one area can have significant, cascading effects on the performance and stability of the entire system. I also learned to identify and mitigate common pitfalls, architectural flaws, and performance bottlenecks that often plague less experienced practitioners in this field. The lecture effectively bridged the theoretical-practical divide by providing multiple concrete examples, such as the optimization of data structures, the implementation of scalable algorithms, and the rigorous testing of edge-case scenarios. I now feel equipped with a comprehensive toolkit of analytical skills and technical knowledge that will be indispensable for my upcoming projects, laboratory assessments, and future career challenges. This session has not only sharpened my technical proficiency but has also enhanced my ability to think like a professional engineer, prioritizing efficiency, reliability, and logical consistency in all my academic and professional endeavors.`,
                "APP": `The practical and professional applications of the knowledge I have acquired are both vast and immediately relevant to my trajectory as a future leader in the field of technology and engineering. I recognize that the concepts mastered today are not merely academic abstractions, but are the very building blocks used by industry professionals to architect and maintain the sophisticated systems that power our modern world. My immediate plan of action involves a rigorous application of these principles within my own personal development projects and upcoming university assignments, where I intend to implement the advanced methodologies we discussed to ensure maximum scalability and efficiency. I am particularly eager to apply these concepts to solve complex optimization problems, utilizing the specific frameworks and logical structures that were highlighted during the lecture. Furthermore, I see immense value in using this knowledge to pressure-test my existing codebase, identifying areas for improvement and refactoring my work to meet higher professional standards. In the broader context of my future career, the ability to articulate and implement these concepts with such a high degree of technical precision will be a definitive competitive advantage during technical interviews and in my eventual professional roles. I plan to continue my exploration of this topic by engaging with industry-standard documentation, contributing to open-source initiatives that utilize these technologies, and staying abreast of the latest research and developments in the field. By treating these academic concepts as professional tools, I am actively narrowing the gap between my current status as a student and my ultimate goal of becoming a highly competent, innovative engineer.`,
                "CONC": `In conclusion, this comprehensive session has represented a significant milestone in my academic development, fundamentally reshaping my understanding of the subject and solidifying my technical foundation for the remainder of the semester. The intensive exploration of both theoretical frameworks and practical applications has successfully resolved numerous lingering doubts and has provided a clear, logical path forward for my continued studies. I now possess a unified and highly sophisticated mental model, one that integrates seamlessly with the broader themes of the syllabus and provides a robust framework for approaching even more advanced modules in the future. The transformation in my perspective has been profound; I have moved from a fragmented understanding of individual concepts to a holistic appreciation of how these elements interact to form a cohesive, powerful system. This learning experience has not only augmented my technical skill set but has also refined my overall analytical approach, teaching me to prioritize logical structure, technical rigor, and practical efficiency in all my work. I feel exceptionally well-prepared for the challenges of upcoming assessments and projects, possessing both the confidence and the competence required to excel at the highest academic levels. The value of the time and effort invested in this session cannot be overstated, as the insights and techniques gained here will continue to yield dividends throughout my university career and well into my professional life. I leave this module with a renewed sense of purpose, a deepened passion for engineering, and an unshakeable commitment to achieving excellence in all my future academic and professional pursuits.`
            };
            res.json({ text: fallbackTemplates[sectionTag] || fallbackTemplates["CONC"] });
        }
    }
});

app.get("/", (req, res) => res.send("QuickJournal Engine Active 🚀"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));