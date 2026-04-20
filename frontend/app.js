/**
 * app.js
 * Core application logic, AI generation, and PDF generation.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------------- STEPPER ----------------
    let currentStep = 1;
    const totalSteps = 3;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const generateBtn = document.getElementById('generateBtn');

    function updateUI() {
        for (let i = 1; i <= totalSteps; i++) {
            document.getElementById(`step-${i}`).classList.remove('active');
            const indicator = document.getElementById(`indicator-${i}`).firstElementChild;

            if (i < currentStep) {
                indicator.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-md transition-colors";
                indicator.innerHTML = "✓";
            } else if (i === currentStep) {
                indicator.className = "w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold shadow-lg shadow-violet-500/40 transition-colors";
                indicator.innerHTML = i;
            } else {
                indicator.className = "w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-bold transition-colors";
                indicator.innerHTML = i;
            }
        }

        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Progress Bar
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        const progressBar = document.getElementById('progress-bar');
        if(progressBar) progressBar.style.width = `${progress}%`;

        prevBtn.classList.toggle('hidden', currentStep === 1);

        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            generateBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            generateBtn.classList.add('hidden');
        }
    }

    function validateCurrentStep() {
        const currentContainer = document.getElementById(`step-${currentStep}`);
        const inputs = currentContainer.querySelectorAll('input, select, textarea');
        let isValid = true;
        inputs.forEach(input => {
            if(!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    nextBtn.addEventListener('click', () => {
        if(validateCurrentStep()) {
            currentStep++;
            updateUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateUI();
    });

    // ---------------- DROPDOWNS ----------------
    const yearSel = document.getElementById('year');
    const termSel = document.getElementById('term');
    const subjSel = document.getElementById('subject');
    const assessSel = document.getElementById('assessmentNo');
    const topicInp = document.getElementById('topic');

    // Helper to enable a select and style it as active
    function enableSelect(sel) {
        sel.disabled = false;
        sel.classList.remove('bg-slate-50', 'cursor-not-allowed');
        sel.classList.add('bg-white');
    }

    // Helper to disable a select and reset it
    function disableSelect(sel, placeholder) {
        sel.innerHTML = `<option value="">${placeholder}</option>`;
        sel.disabled = true;
        sel.classList.add('bg-slate-50', 'cursor-not-allowed');
        sel.classList.remove('bg-white');
    }

    yearSel.addEventListener('change', () => {
        const year = yearSel.value;
        termSel.innerHTML = '<option value="" disabled selected>Select Term</option>';
        Object.keys(academicData[year] || {}).forEach(term => {
            termSel.innerHTML += `<option value="${term}">Term ${term}</option>`;
        });
        enableSelect(termSel);
        disableSelect(subjSel, 'Select Term First');
        disableSelect(assessSel, 'Select Subject First');
        topicInp.value = "";
    });

    termSel.addEventListener('change', () => {
        const year = yearSel.value;
        const term = termSel.value;
        subjSel.innerHTML = '<option value="" disabled selected>Select Subject</option>';
        Object.keys(academicData[year]?.[term] || {}).forEach(sub => {
            subjSel.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
        enableSelect(subjSel);
        disableSelect(assessSel, 'Select Subject First');
        topicInp.value = "";
    });

    subjSel.addEventListener('change', () => {
        const year = yearSel.value;
        const term = termSel.value;
        const sub  = subjSel.value;
        const modules = academicData[year]?.[term]?.[sub] || {};

        // ✅ Populate module dropdown with "Module I - Title" labels from data.js
        assessSel.innerHTML = '<option value="" disabled selected>Select Module</option>';
        const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
        Object.keys(modules).forEach(num => {
            const moduleData = modules[num];
            const title = moduleData.title || `Module ${num}`;
            const roman = romanNumerals[parseInt(num) - 1] || num;
            assessSel.innerHTML += `<option value="${num}">Module ${roman} - ${title}</option>`;
        });
        enableSelect(assessSel);
        topicInp.value = "";
    });

    // ✅ When module is selected, show the module title in the topic box
    function updateTopic() {
        const y = yearSel.value;
        const t = termSel.value;
        const s = subjSel.value;
        const a = assessSel.value;
        const moduleData = academicData[y]?.[t]?.[s]?.[a];
        if (moduleData) {
            topicInp.value = moduleData.title || DEFAULT_TOPIC;
        } else {
            topicInp.value = "";
        }
    }

    assessSel.addEventListener('change', updateTopic);

    function formatDate(dateStr) {
        if(!dateStr) return "";
        const p = dateStr.split("-");
        return `${p[2]}-${p[1]}-${p[0]}`;
    }

    // ---------------- AI AUTO-FILL LOGIC ----------------
    const aiFillBtn = document.getElementById('aiFillBtn');
    
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

        // ✅ Get the full syllabus text for this module from data.js
        const moduleData = academicData[y]?.[t]?.[subject]?.[moduleNum];
        const syllabus = moduleData?.syllabus || topic;
        const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
        const moduleRoman = romanNumerals[parseInt(moduleNum) - 1] || moduleNum;

        const aiSpinner = document.getElementById('aiSpinner');
        const aiErrorMsg = document.getElementById('aiErrorMsg');
        
        aiSpinner.classList.remove('hidden');
        aiFillBtn.disabled = true;
        aiErrorMsg.classList.add('hidden');

        // ✅ STEP: Replace the URL below with YOUR n8n cloud webhook URL
        const endpoint = 'http://localhost:3000/api/generate';

        
        // ✅ Rich prompt that includes the FULL syllabus so AI writes accurate content
        const prompt =`
You are a B.Tech student writing a reflective journal for an academic submission.

Write a detailed reflective journal of around 2000-2200 words.

Subject: ${subject}
Module: Module ${moduleRoman} - ${topic}

Topics Covered:
Class Attributes and Methods:
- Class attributes
- Instance attributes and updating attributes
- Access modifiers
- Instance methods, class methods, static methods
- Encapsulation

---------------------------------------

STRUCTURE (STRICTLY FOLLOW):

[EXP]
Write about your classroom experience.
Explain what was taught, how the teacher explained it, and include examples.
Example: How class attributes differ from instance attributes using real-life analogy like students sharing common vs personal data.

[FEEL]
Describe your feelings while learning.
Mention confusion, curiosity, interest.
Example: Difficulty in understanding static methods initially, then clarity after examples.

[LEARN]
Explain key concepts you understood deeply.
Include examples like:
- Class vs instance attributes
- Encapsulation in real-world (bank account example)
- Access modifiers importance

[APP]
Explain how you will apply this knowledge.
Include practical examples:
- Building real projects
- Writing cleaner OOP code
- Using encapsulation in software

[CONC]
Summarize your overall learning.
Explain how your thinking improved.

---------------------------------------

WRITING STYLE RULES (VERY IMPORTANT):

- Write in FIRST PERSON (I learned, I felt)
- Use SIMPLE English
- Make it HUMAN, not robotic
- Add small imperfections (like real student writing)
- Use real-life analogies
- Avoid textbook definitions
- Smooth transitions between paragraphs
- Each section should feel natural and reflective

---------------------------------------

WORD COUNT:

- Total ~2100 words
- Each section ~420 words

---------------------------------------

IMPORTANT:

- DO NOT use bullet points
- DO NOT use markdown or symbols
- Write only in paragraphs
- MUST follow section tags: [EXP], [FEEL], [LEARN], [APP], [CONC]
- Content should feel like written by a real student
`;


        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt }) 
            });
        
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.error || "API request failed.";
                throw new Error(msg);
            }
            
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text;

            // Parse sections using markers
            const expMatch  = text.match(/\[EXP\]([\s\S]*?)\[FEEL\]/i);
            const feelMatch = text.match(/\[FEEL\]([\s\S]*?)\[LEARN\]/i);
            const learnMatch= text.match(/\[LEARN\]([\s\S]*?)\[APP\]/i);
            const appMatch  = text.match(/\[APP\]([\s\S]*?)\[CONC\]/i);
            const concMatch = text.match(/\[CONC\]([\s\S]*?)$/i);

            if (expMatch)   document.getElementById('experience').value  = expMatch[1].replace(/\*/g, '').trim();
            if (feelMatch)  document.getElementById('feelings').value    = feelMatch[1].replace(/\*/g, '').trim();
            if (learnMatch) document.getElementById('learning').value    = learnMatch[1].replace(/\*/g, '').trim();
            if (appMatch)   document.getElementById('application').value = appMatch[1].replace(/\*/g, '').trim();
            if (concMatch)  document.getElementById('conclusion').value  = concMatch[1].replace(/\*/g, '').trim();

        } catch (error) {
            console.error("AI Generation Error:", error);
            aiErrorMsg.textContent = "❌ " + (error.message || "Failed to connect to AI. Please check your API key or fill the boxes manually.");
            aiErrorMsg.classList.remove('hidden');
        } finally {
            aiSpinner.classList.add('hidden');
            aiFillBtn.disabled = false;
        }
    });

    // ---------------- FORM SUBMIT & PDF GENERATION ----------------
    document.getElementById('journalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!validateCurrentStep()) return;

        const successMsg = document.getElementById('successMsg');
        successMsg.classList.add('hidden');
        
        // Helper to load image
        const getBase64ImageFromURL = (url) => {
            return new Promise((resolve, reject) => {
                var img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                };
                img.onerror = error => reject(error);
                img.src = url;
            });
        };

        try {
            const btnText = document.getElementById('btnText');
            if (btnText) btnText.innerText = "Generating PDF...";
            document.getElementById('generateBtn').disabled = true;

            const headerImageData = await getBase64ImageFromURL('header.png').catch(() => null);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });

            // ✅ Build module label e.g. "Module III - Strings & String Operations"
            const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
            const moduleNum = assessSel.value;
            const moduleRoman = romanNumerals[parseInt(moduleNum) - 1] || moduleNum;
            const moduleLabel = `${moduleRoman}`;

            const data = {
                name: document.getElementById('studentName').value,
                reg: document.getElementById('regNumber').value,
                sec: document.getElementById('classSection').value,
                yt: `Year ${yearSel.value} - Term ${termSel.value}`,
                sub: subjSel.value,
                assNum: moduleLabel,
                date: formatDate(document.getElementById('journalDate').value),
                topic: topicInp.value,
                exp: document.getElementById('experience').value,
                feel: document.getElementById('feelings').value,
                learn: document.getElementById('learning').value,
                app: document.getElementById('application').value,
                conc: document.getElementById('conclusion').value
            };

            const pageWidth = doc.internal.pageSize.width;
            let startY = 45; // Start below the header space

            // Table 1: Student Information
            doc.autoTable({
                startY: startY,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Student Name', styles: { fontStyle: 'bold', cellWidth: 50 } }, { content: data.name, colSpan: 2, styles: { fontStyle: 'bold' } }],
                    [{ content: 'Student Registration Number', styles: { fontStyle: 'bold' } }, { content: data.reg }, { content: `Class & Section: ${data.sec}`, styles: { fontStyle: 'bold' } }],
                    [{ content: 'Study Level : UG/PG', styles: { fontStyle: 'bold' } }, { content: 'UG' }, { content: `Year & Term: ${data.yt}`, styles: { fontStyle: 'bold' } }],
                    [{ content: 'Subject Name', styles: { fontStyle: 'bold' } }, { content: data.sub, colSpan: 2, styles: { fontStyle: 'bold' } }]
                ],
            });

            // Table 2: Assessment Data
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 5,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Name of the Assessment', styles: { fontStyle: 'bold', cellWidth: 60 } }, { content: `Reflective Journal - ${data.assNum}` }],
                    [{ content: 'Date of Submission', styles: { fontStyle: 'bold' } }, { content: data.date }]
                ],
            });

            // Center Title
            let currentY = doc.lastAutoTable.finalY + 15;
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text(`Reflective Journal - ${data.assNum}`, pageWidth/2, currentY, { align: "center" });
            
            // Table 3: Topic Header
            currentY += 8;
            doc.autoTable({
                startY: currentY,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Date', styles: { fontStyle: 'normal', textColor: [192, 0, 0], cellWidth: 40 } }, { content: data.date }],
                    [{ content: 'Journal Entry\nTopic', styles: { fontStyle: 'normal', textColor: [192, 0, 0] } }, { content: data.topic }]
                ],
            });

            // Formal Boxed Content Sections
            const drawContentSection = (title, content, startPosY) => {
                doc.autoTable({
                    startY: startPosY,
                    margin: { top: 45 },
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 4 },
                    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
                    body: [[title, content || ""]],
                });
            };

            drawContentSection('1. Experience\n(Class Content)', data.exp, doc.lastAutoTable.finalY);
            drawContentSection('2. Feelings\n(Emotional Reactions)', data.feel, doc.lastAutoTable.finalY);
            drawContentSection('3. Learning\n(Key Insights)', data.learn, doc.lastAutoTable.finalY);
            drawContentSection('4. Application\n(Practical Use)', data.app, doc.lastAutoTable.finalY);
            drawContentSection('5. Conclusion', data.conc, doc.lastAutoTable.finalY);

            // Add watermark link at the bottom center
            const watermarkY = doc.lastAutoTable.finalY + 15;
            doc.setFont("times", "italic");
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128); // Grey color for subtle watermark
            doc.text("Generated with QuickJournal", pageWidth / 2, watermarkY, { align: "center" });
            
            // Reset state
            doc.setTextColor(0, 0, 0);
            doc.setFont("times", "normal");

            // Draw header image on ALL pages created
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                if (headerImageData) {
                    doc.addImage(headerImageData, 'PNG', 0, 0, pageWidth, 35);
                } else {
                    // Fallback if image failed to load
                    doc.setFont("times", "bold");
                    doc.setFontSize(16);
                    doc.text("AURORA HIGHER EDUCATION", pageWidth/2, 15, { align: "center" });
                    doc.text("AND RESEARCH ACADEMY", pageWidth/2, 21, { align: "center" });
                    doc.setFontSize(11);
                    doc.setFont("times", "normal");
                    doc.text("Deemed-to-be-University Estd.u/s.03 of UGC Act 1956", pageWidth/2, 27, { align: "center" });
                    doc.setFontSize(10);
                    doc.text("Uppal, Hyderabad, Telangana | Bhongir, Yadadri, Telangana", pageWidth/2, 33, { align: "center" });
                }
            }

            // DOWNLOAD THE PDF
            const safeName = data.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const safeReg = data.reg.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const safeSub = data.sub.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const cleanFilename = `${safeName}_${safeReg}_ReflectiveJournal_${safeSub}-${moduleRoman}`;
            doc.save(`${cleanFilename}.pdf`);

            // Show Success Notification
            successMsg.classList.remove('hidden');

            if (document.getElementById('btnText')) {
                document.getElementById('btnText').innerText = "Generate PDF";
                document.getElementById('generateBtn').disabled = false;
            }

        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("An error occurred while building the PDF structure. Please try again.");
            if (document.getElementById('btnText')) {
                document.getElementById('btnText').innerText = "Generate PDF";
                document.getElementById('generateBtn').disabled = false;
            }
        }
    });

    // Initialize UI on load
    updateUI();
});