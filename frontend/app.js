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
    const serverStatus = document.getElementById('serverStatus');

    // 🌐 CONFIGURATION
    const REMOTE_URL = 'https://quickjournal-backend.onrender.com';
    const LOCAL_URL = 'http://localhost:5000';
    let API_BASE_URL = REMOTE_URL; // Default

    // 🛰️ SERVER HEALTH CHECK
    async function checkServer() {
        const statusText = serverStatus.querySelector('span:last-child');
        const statusDot = serverStatus.querySelector('span:first-child');

        try {
            // First, try local backend (fastest for development)
            try {
                const localRes = await fetch(`${LOCAL_URL}/`, { signal: AbortSignal.timeout(2000) });
                if (localRes.ok) {
                    API_BASE_URL = LOCAL_URL;
                    setServerLive("LOCAL LIVE");
                    return;
                }
            } catch (e) { /* Local not running, ignore */ }

            // Then try remote backend
            setServerChecking("WAKING UP...");
            const res = await fetch(`${REMOTE_URL}/`, { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
                API_BASE_URL = REMOTE_URL;
                setServerLive("SERVER LIVE");
            } else {
                throw new Error();
            }
        } catch (e) {
            serverStatus.className = "ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-[10px] font-bold text-rose-600 flex items-center gap-1.5 shadow-sm";
            serverStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span>SERVER OFFLINE</span>';
        }
    }

    function setServerLive(text) {
        serverStatus.className = "ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 shadow-sm";
        serverStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>${text}</span>`;
    }

    function setServerChecking(text) {
        serverStatus.className = "ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 flex items-center gap-1.5";
        serverStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span><span>${text}</span>`;
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

    // 🛠️ CLIENT-SIDE FALLBACK (When server is offline)
    function getClientFallback(tag, subject, topic) {
        const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const intros = [
            `My study of ${topic} in the context of ${subject} has been a transformative experience. `,
            `The session on ${topic} provided critical insights into how ${subject} operates in real-world environments. `,
            `Exploring ${topic} today allowed me to bridge the gap between theoretical knowledge and practical application. `,
            `The lecture on ${topic} was particularly engaging, especially when we discussed its role in ${subject}. `
        ];
        const bodies = [
            `I was fascinated by the underlying mechanics of ${topic} and how they integrate with broader ${subject} principles. `,
            `We analyzed several use cases where ${topic} directly impacts the efficiency and reliability of systems. `,
            `The discussion around ${topic} highlighted the importance of precision and structured thinking in ${subject}. `,
            `Mastering the nuances of ${topic} has given me a much clearer understanding of the challenges in this field. `
        ];
        const feelings = [
            `Initially, I felt overwhelmed by the complexity of ${topic}, but as we progressed, I gained significant confidence. `,
            `There was a distinct sense of accomplishment when I finally grasped the core logic behind ${topic}. `,
            `This module has genuinely sparked my interest in further specializing in ${subject} and related technologies. `,
            `I feel much more equipped to handle technical assessments now that I understand ${topic} so thoroughly. `
        ];
        const conclusions = [
            `Looking ahead, I am eager to apply these ${topic} strategies in my upcoming projects. `,
            `This session reinforced my belief that a strong foundation in ${topic} is essential for any professional in ${subject}. `,
            `I plan to dedicate more time to researching the advanced applications of ${topic} to stay ahead in my studies. `
        ];

        let text = r(intros) + r(bodies) + r(feelings) + r(conclusions);
        // Force word count
        while(text.split(/\s+/).length < 450) {
            text += ` Additionally, we must consider how ${topic} interacts with other components of ${subject}. The multi-faceted nature of ${topic} requires a holistic approach to problem-solving. ${r(conclusions)} `;
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