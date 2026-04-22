const extractSection = (text, startTag, endTag) => {
    const regex = new RegExp(`\\[${startTag}\\]([\\s\\S]*?)(\\[${endTag}\\]|$)`, "i");
    const match = text.match(regex);
    return match ? match[1].replace(/\*/g, '').trim() : "";
};

const text1 = "[EXP]\nexp text\n[FEEL]\nfeel text";
console.log("EXP-FEEL:", extractSection(text1, "EXP", "FEEL"));

const text2 = "[CONC]\nconclusion text";
console.log("CONC-END:", extractSection(text2, "CONC", "END"));
