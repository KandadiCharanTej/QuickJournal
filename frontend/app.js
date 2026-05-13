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

    // 🌐 CONFIGURATION
    const REMOTE_URL = 'https://quickjournal-backend.onrender.com';
    const LOCAL_URL = 'http://localhost:5000';
    let API_BASE_URL = REMOTE_URL; // Default

    // 🛰️ SERVER HEALTH CHECK
    async function checkServer() {
        try {
            // First, try local backend (fastest for development)
            try {
                const localRes = await fetch(`${LOCAL_URL}/`, { signal: AbortSignal.timeout(2000) });
                if (localRes.ok) {
                    API_BASE_URL = LOCAL_URL;
                    return;
                }
            } catch (e) { /* Local not running, ignore */ }

            // Then try remote backend
            const res = await fetch(`${REMOTE_URL}/`, { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
                API_BASE_URL = REMOTE_URL;
            }
        } catch (e) {
            // Fallback to REMOTE_URL as default if both fail (the app handles offline internally)
            API_BASE_URL = REMOTE_URL;
        }
    }

    checkServer();

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

        // Populate module dropdown with "Module I - Title" labels from data.js
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

    // When module is selected, show the module title in the topic box
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

    // 🛠️ CLIENT-SIDE FALLBACK (When server is offline or fails)
    function getClientFallback(tag, subject, topic) {
        const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
        
        // Section-specific content pools
        const pools = {
            EXP: {
                intros: [
                    `During the session on ${topic}, the atmosphere in the class was quite focused as we delved into ${subject}. `,
                    `The lecture today centered primarily on the core concepts of ${topic} within our ${subject} curriculum. `,
                    `Our professor introduced ${topic} today, explaining its fundamental role in modern ${subject} applications. `,
                    `I spent a significant portion of today's class exploring the intricacies of ${topic}. `
                ],
                bodies: [
                    `We started by looking at the basic architecture and then moved into more complex implementations. `,
                    `The teacher used several real-world analogies to explain how ${topic} works in a production environment. `,
                    `A key part of the demonstration involved showing how ${topic} interacts with existing systems. `,
                    `I took detailed notes as we walked through the step-by-step process of implementing ${topic}. `
                ]
            },
            FEEL: {
                intros: [
                    `Reflecting on today's lesson, I found myself initially quite challenged by ${topic}. `,
                    `I felt a genuine sense of curiosity when the topic of ${topic} was first brought up. `,
                    `There was a moment of "aha!" for me when the connection between ${topic} and ${subject} became clear. `,
                    `Honestly, I felt a bit overwhelmed at first because ${topic} seemed quite abstract. `
                ],
                bodies: [
                    `However, as the lecture progressed, my confusion turned into a growing interest in the subject. `,
                    `It was exciting to see how these theories actually apply to the tools I use every day. `,
                    `I feel much more confident now that I've seen the logic behind the implementation. `,
                    `This session has encouraged me to look deeper into ${subject} as a potential career path. `
                ]
            },
            LEARN: {
                intros: [
                    `The most critical takeaway from today's study of ${topic} was the importance of structural integrity. `,
                    `I managed to grasp several key technical points regarding ${topic} that I hadn't understood before. `,
                    `Learning about ${topic} has completely changed my perspective on how ${subject} should be approached. `,
                    `Through various examples, I learned that ${topic} is not just a theory but a practical necessity. `
                ],
                bodies: [
                    `One major insight was the efficiency gain when using these specific methods. `,
                    `I understood the relationship between different components and how they synchronize. `,
                    `The concept of optimization in ${topic} was particularly enlightening for me. `,
                    `I learned the best practices for maintaining clean and scalable code in this context. `
                ]
            },
            APP: {
                intros: [
                    `I am already planning to implement these ${topic} concepts in my current personal project. `,
                    `The practical utility of ${topic} in the industry cannot be overstated. `,
                    `I can see myself using this knowledge to solve performance bottlenecks in future assignments. `,
                    `Moving forward, I will prioritize using ${topic} whenever I deal with complex ${subject} tasks. `
                ],
                bodies: [
                    `Applying these methods will likely reduce the time I spend on debugging and testing. `,
                    `I intend to share these insights with my peers to improve our collaborative project workflow. `,
                    `Specifically, I want to explore how ${topic} can be integrated with mobile platforms. `,
                    `The ability to apply these theories in real-time is a skill I plan to master. `
                ]
            },
            CONC: {
                intros: [
                    `In conclusion, the study of ${topic} has been a highly rewarding part of this term. `,
                    `Overall, I feel that my understanding of ${subject} has reached a new level today. `,
                    `Summarizing my experience, ${topic} is definitely a cornerstone of my academic progress. `,
                    `To wrap up, I am grateful for the deep dive we took into ${topic} this week. `
                ],
                bodies: [
                    `I look forward to building upon this foundation in the coming modules. `,
                    `This knowledge has equipped me with the tools I need for advanced assessments. `,
                    `I will continue to reflect on these lessons as I move toward my final project. `,
                    `The journey of learning ${subject} continues to be both challenging and inspiring. `
                ]
            }
        };

        const pool = pools[tag] || pools.EXP;
        const conclusions = [
            `It's clear that mastering ${topic} is essential for any professional in ${subject}. `,
            `I am excited to see where this new understanding takes my academic journey. `,
            `This session reinforced the idea that consistent practice is key to success. `,
            `I feel prepared to tackle the next set of challenges in this module. `
        ];

        // Randomly decide to add bullet points (only for LEARN and APP)
        let bulletSection = "";
        if ((tag === 'LEARN' || tag === 'APP') && Math.random() > 0.4) {
            const points = [
                `Understanding the core architecture of ${topic}.`,
                `Applying ${subject} principles to solve edge cases.`,
                `Optimizing the performance of the overall system.`,
                `Collaborating on ${topic} implementation with teammates.`,
                `Analyzing the impact of ${topic} on scalability.`
            ];
            // Shuffle and pick 3
            const shuffled = points.sort(() => 0.5 - Math.random()).slice(0, 3);
            bulletSection = "\n\nKey Highlights:\n" + shuffled.map(p => "• " + p).join("\n") + "\n\n";
        }

        let text = r(pool.intros) + r(pool.bodies) + r(conclusions);
        if (bulletSection) text += bulletSection;

        // Force word count with diverse padding
        while(text.split(/\s+/).length < 430) {
            const padding = [
                `Furthermore, we discussed how ${topic} serves as a bridge between theoretical frameworks and industrial requirements. `,
                `The complexity of ${topic} requires a very methodical approach to ensure that every variable is accounted for correctly. `,
                `When we look at the historical development of ${subject}, it becomes obvious why ${topic} is so relevant today. `,
                `Moreover, the interactive nature of the class allowed for a better exchange of ideas regarding the future of ${topic}. `,
                `I also found that comparing ${topic} with other similar modules helped in solidifying my basic understanding. `
            ];
            text += r(padding);
        }

        return text.trim();
    }

    const aiFillBtn = document.getElementById('aiFillBtn');

    function extractSection(text, startTag, endTag) {
        const regex = new RegExp(`\\[${startTag}\\]([\\s\\S]*?)(\\[${endTag}\\]|$)`, "i");
        const match = text.match(regex);
        return match ? match[1].replace(/\*/g, '').trim() : "";
    }

    aiFillBtn.addEventListener('click', async () => {
        if (aiFillBtn.disabled) return;

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
        
        aiFillBtn.disabled = true;
        const originalBtnHTML = aiFillBtn.innerHTML;
        aiErrorMsg.classList.add('hidden');

        const sections = [
            { tag: "EXP", id: "experience", name: "Experience" },
            { tag: "FEEL", id: "feelings", name: "Feelings" },
            { tag: "LEARN", id: "learning", name: "Learning" },
            { tag: "APP", id: "application", name: "Application" },
            { tag: "CONC", id: "conclusion", name: "Conclusion" }
        ];

        // ⏱️ VISUAL TIMER HELPER
        function startCooldownTimer(seconds) {
            aiFillBtn.disabled = true;
            let timeLeft = seconds;
            
            const cooldownInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(cooldownInterval);
                    aiFillBtn.disabled = false;
                    aiFillBtn.innerHTML = originalBtnHTML;
                    aiErrorMsg.classList.add('hidden');
                } else {
                    aiFillBtn.innerHTML = `<span>⏳ Wait ${timeLeft}s...</span>`;
                    timeLeft--;
                }
            }, 1000);
        }

        // ⏱️ PRE-GENERATION COUNTDOWN (To relieve AI pressure)
        let countdown = 3;
        const timerInterval = setInterval(async () => {
            if (countdown <= 0) {
                clearInterval(timerInterval);
                
                try {
                    aiFillBtn.innerHTML = `<span>✨ Generating Content...</span>`;
                    aiSpinner.classList.remove('hidden');

                    // SEQUENTIAL GENERATION
                    for (const sec of sections) {
                        aiFillBtn.innerHTML = `<span>✨ Generating ${sec.name}...</span>`;
                        let retries = 3;
                        let success = false;
                        let lastError = "";

                        while (retries > 0 && !success) {
                            try {
                                const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ subject, moduleRoman, topic, syllabus, sectionTag: sec.tag })
                                });

                                const data = await res.json();

                                if (!res.ok) {
                                    if (data.retryAfter) {
                                        throw new Error(`RATELIMIT:${data.retryAfter}:${data.error}`);
                                    }
                                    throw new Error(data.error || `Failed to generate ${sec.name}`);
                                }

                                const textarea = document.getElementById(sec.id);
                                textarea.value = data.text;
                                textarea.dispatchEvent(new Event('input'));
                                success = true;
                                await new Promise(r => setTimeout(r, 1000)); 

                            } catch (err) {
                                lastError = err.message;
                                if (lastError.startsWith("RATELIMIT:")) {
                                    // Handle rate limits with the timer
                                    aiErrorMsg.innerHTML = `❌ <b>Limit Hit:</b> ${lastError.split(":")[2]}. <br> Wait for the timer.`;
                                    aiErrorMsg.classList.remove('hidden');
                                    startCooldownTimer(parseInt(lastError.split(":")[1]));
                                    return; // Stop everything
                                }
                                retries--;
                                if (retries > 0) {
                                    aiFillBtn.innerHTML = `<span>⚠️ Retrying ${sec.name} (${retries})...</span>`;
                                    await new Promise(r => setTimeout(r, 2000));
                                }
                            }
                        }

                        if (!success) {
                            console.warn(`Backend failed for ${sec.name} after retries: ${lastError}. Using client fallback.`);
                            const textarea = document.getElementById(sec.id);
                            textarea.value = getClientFallback(sec.tag, subject, topic);
                            textarea.dispatchEvent(new Event('input'));
                        }
                    }

                    aiFillBtn.innerHTML = `<span>✅ All Sections Generated!</span>`;
                    aiSpinner.classList.add('hidden');
                    
                    setTimeout(() => {
                        aiFillBtn.disabled = false;
                        aiFillBtn.innerHTML = originalBtnHTML;
                    }, 3000);

                } catch (error) {
                    console.error("AI Generation Critical Error:", error);
                    aiSpinner.classList.add('hidden');
                    aiErrorMsg.textContent = "❌ " + error.message;
                    aiErrorMsg.classList.remove('hidden');
                    aiFillBtn.disabled = false;
                    aiFillBtn.innerHTML = originalBtnHTML;
                }
            } else {
                aiFillBtn.innerHTML = `<span>Generating in ${countdown}s...</span>`;
                countdown--;
            }
        }, 1000);
    });

    // ---------------- FORM SUBMIT & PDF GENERATION ----------------
    document.getElementById('journalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!validateCurrentStep()) return;

        const successMsg = document.getElementById('successMsg');
        successMsg.classList.add('hidden');
        successMsg.classList.remove('active');
        
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

            // Build module label e.g. "Module III - Strings & String Operations"
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
            successMsg.classList.add('active');

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

    // ---------------- RESET / NEW JOURNAL ----------------
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Reset to Step 1
            currentStep = 1;
            
            // Hide Success Message
            const successMsg = document.getElementById('successMsg');
            if (successMsg) {
                successMsg.classList.add('hidden');
                successMsg.classList.remove('active');
            }

            // Fields to clear (Step 2 and Step 3)
            // We keep Step 1 (Student Info) as it's usually the same person
            const academicFields = ['year', 'term', 'subject', 'assessmentNo', 'journalDate', 'topic'];
            const contentFields = ['experience', 'feelings', 'learning', 'application', 'conclusion'];

            academicFields.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.tagName === 'SELECT') {
                        el.selectedIndex = 0;
                        if (id !== 'year') {
                            // Reset to disabled state using existing logic
                            el.disabled = true;
                            el.classList.add('bg-slate-50', 'cursor-not-allowed');
                            el.classList.remove('bg-white');
                            const placeholder = id === 'assessmentNo' ? 'Select Subject First' : 
                                              (id === 'subject' ? 'Select Term First' : 'Select Year First');
                            el.innerHTML = `<option value="">${placeholder}</option>`;
                        }
                    } else {
                        el.value = '';
                    }
                }
            });

            contentFields.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = '';
                    // Trigger input for word count badges
                    el.dispatchEvent(new Event('input'));
                }
            });

            // Update Stepper and UI
            updateUI();

            // Smooth scroll back to top of dashboard
            document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---------------- MILESTONE CELEBRATION ----------------
    const milestoneBadge = document.getElementById('milestoneBadge');
    const milestoneModal = document.getElementById('milestoneModal');
    const closeMilestone = document.getElementById('closeMilestone');
    const modalOverlay = document.getElementById('modalOverlay');

    if (milestoneBadge && milestoneModal) {
        const showModal = () => {
            milestoneModal.classList.remove('hidden');
            setTimeout(() => {
                milestoneModal.classList.add('active');
            }, 10);
        };

        const hideModal = () => {
            milestoneModal.classList.remove('active');
            setTimeout(() => {
                milestoneModal.classList.add('hidden');
            }, 500);
        };

        milestoneBadge.addEventListener('click', showModal);
        closeMilestone.addEventListener('click', hideModal);
        modalOverlay.addEventListener('click', hideModal);

        // AUTO-SHOW LOGIC (Every 3 days for 1 month)
        const checkMilestoneAutoShow = () => {
            const now = Date.now();
            let firstSeen = localStorage.getItem('milestone_first_seen');
            let lastShown = localStorage.getItem('milestone_last_shown');
            
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

            if (!firstSeen) {
                localStorage.setItem('milestone_first_seen', now);
                firstSeen = now;
            }

            // Stop auto-showing after 1 month
            if (now - firstSeen > thirtyDaysInMs) return;

            // Show if it's the first time OR 3 days have passed since last auto-show
            if (!lastShown || (now - lastShown > threeDaysInMs)) {
                setTimeout(() => {
                    showModal();
                    localStorage.setItem('milestone_last_shown', Date.now());
                }, 2500); // Wait 2.5s after load to not overwhelm the user
            }
        };

        checkMilestoneAutoShow();
    }

    // ---------------- WORD COUNT TRACKING ----------------
    const textareas = ['experience', 'feelings', 'learning', 'application', 'conclusion'];
    textareas.forEach(id => {
        const area = document.getElementById(id);
        const badge = document.getElementById(`wc-${id}`);
        
        const updateCount = () => {
            const text = area.value.trim();
            const words = text ? text.split(/\s+/).length : 0;
            badge.innerText = `${words} words`;
            
            // Color feedback (Green at 450+ words)
            if (words >= 450) {
                badge.className = "text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-600 font-bold";
            } else if (words >= 350) {
                badge.className = "text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-600 font-bold";
            } else {
                badge.className = "text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold";
            }
        };

        area.addEventListener('input', updateCount);
        // Initial count if needed
        updateCount();
    });

    // Initialize UI on load
    updateUI();
});