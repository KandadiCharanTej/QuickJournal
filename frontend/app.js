// ---------------- AI AUTO-FILL LOGIC ----------------
const aiFillBtn = document.getElementById('aiFillBtn');

function extractSection(text, startTag, endTag) {
    const regex = new RegExp(`\\[${startTag}\\]([\\s\\S]*?)(\\[${endTag}\\]|$)`, "i");
    const match = text.match(regex);
    return match ? match[1].replace(/\*/g, '').trim() : "";
}

aiFillBtn.addEventListener('click', async () => {
    const topic = topicInp.value;
    const subject = subjSel.value;
    const moduleNum = assessSel.value;
    const y = yearSel.value;
    const t = termSel.value;

    if(!topic || !subject || !moduleNum) {
        alert("Please complete Step 2: select Year, Term, Subject, and Module first.");
        return;
    }

    const moduleData = academicData[y]?.[t]?.[subject]?.[moduleNum];
    const syllabus = moduleData?.syllabus || topic;
    const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
    const moduleRoman = romanNumerals[parseInt(moduleNum) - 1] || moduleNum;

    const aiSpinner = document.getElementById('aiSpinner');
    const aiErrorMsg = document.getElementById('aiErrorMsg');
    
    aiSpinner.classList.remove('hidden');
    aiFillBtn.disabled = true;
    aiErrorMsg.classList.add('hidden');

    const endpoint = 'https://quickjournal-backend.onrender.com/api/generate';

    const prompt = `
You are a B.Tech student writing a reflective journal.

STRICT FORMAT (DO NOT BREAK):

[EXP]
Write detailed classroom experience based on:
${syllabus}

[FEEL]
Describe feelings while learning.

[LEARN]
Explain concepts clearly with examples.

[APP]
Explain real-life and coding applications.

[CONC]
Give conclusion and learning outcome.

RULES:
- MUST include ALL sections
- DO NOT skip any tag
- DO NOT rename tags
- Write in simple human English
- Use first person (I learned, I felt)
- No bullet points
- Only paragraphs
- Around 2000 words total
`;

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error || "API request failed.");
        }

        const data = await res.json();
        const text = data.text;

        console.log("RAW AI TEXT:", text);

        // 🔥 Robust parsing
        const experience  = extractSection(text, "EXP", "FEEL");
        const feelings    = extractSection(text, "FEEL", "LEARN");
        const learning    = extractSection(text, "LEARN", "APP");
        const application = extractSection(text, "APP", "CONC");
        const conclusion  = extractSection(text, "CONC", "END");

        // Fill safely
        document.getElementById('experience').value  = experience  || "Regenerate content";
        document.getElementById('feelings').value    = feelings    || "Regenerate content";
        document.getElementById('learning').value    = learning    || "Regenerate content";
        document.getElementById('application').value = application || "Regenerate content";
        document.getElementById('conclusion').value  = conclusion  || "Regenerate content";

    } catch (error) {
        console.error("AI Generation Error:", error);
        aiErrorMsg.textContent = "❌ " + error.message;
        aiErrorMsg.classList.remove('hidden');
    } finally {
        aiSpinner.classList.add('hidden');
        aiFillBtn.disabled = false;
    }
});