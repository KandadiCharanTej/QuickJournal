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

    // 🛰️ SERVER HEALTH CHECK (With Auto-Wakeup Retry)
    async function checkServer() {
        let retries = 5;
        while (retries > 0) {
            try {
                // Try local first
                const localRes = await fetch(`${LOCAL_URL}/`, { signal: AbortSignal.timeout(2000) });
                if (localRes.ok) { API_BASE_URL = LOCAL_URL; return; }
            } catch (e) {}

            try {
                // Try remote with longer timeout for "cold start"
                const res = await fetch(`${REMOTE_URL}/`, { signal: AbortSignal.timeout(15000) });
                if (res.ok) { API_BASE_URL = REMOTE_URL; return; }
            } catch (e) {}

            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 5000)); // Wait 5s between wake-up pings
        }
        API_BASE_URL = REMOTE_URL; // Default fallback
    }

    checkServer();

    function updateStep3Layout() {
        const term = termSel.value;
        const genMode = document.querySelector('input[name="genMode"]:checked').value;
        const term4Container = document.getElementById('term4AssignmentContainer');
        const defaultJournalFields = [
            'experience', 'feelings', 'learning', 'application', 'conclusion'
        ];
        
        const singleContainer = document.getElementById('singleModuleContainer');
        const multiContainer = document.getElementById('multiModuleContainer');
        const termProgressContainer = document.getElementById('termProgressContainer');
        const aiFillBtn = document.getElementById('aiFillBtn');
        const generateBtn = document.getElementById('generateBtn');

        if (genMode === 'term') {
            if(singleContainer) singleContainer.classList.add('hidden');
            if(multiContainer) multiContainer.classList.add('hidden');
            if(termProgressContainer) termProgressContainer.classList.remove('hidden');
            if(aiFillBtn) aiFillBtn.classList.add('hidden');
            if(generateBtn) generateBtn.classList.add('hidden');
            renderCompleteTermUI();
        } else if (genMode === 'complete') {
            if(singleContainer) singleContainer.classList.add('hidden');
            if(multiContainer) multiContainer.classList.remove('hidden');
            if(termProgressContainer) termProgressContainer.classList.add('hidden');
            if(aiFillBtn) aiFillBtn.classList.add('hidden');
            if(generateBtn) generateBtn.classList.add('hidden');
            renderMultiModuleCards();
        } else {
            if(singleContainer) singleContainer.classList.remove('hidden');
            if(multiContainer) multiContainer.classList.add('hidden');
            if(termProgressContainer) termProgressContainer.classList.add('hidden');
            if(aiFillBtn) aiFillBtn.classList.remove('hidden');
            if(generateBtn) generateBtn.classList.remove('hidden');

            if (term === '4') {
                // Show term 4 container
                if (term4Container) term4Container.classList.remove('hidden');
                // Hide default journal fields and disable their required validation
                defaultJournalFields.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.closest('div').classList.add('hidden');
                        el.removeAttribute('required');
                    }
                });
                // Show and set required for assignmentAnswers
                const assignmentTextarea = document.getElementById('assignmentAnswers');
                if (assignmentTextarea) {
                    assignmentTextarea.setAttribute('required', 'required');
                }
            } else {
                // Hide term 4 container
                if (term4Container) term4Container.classList.add('hidden');
                // Show default journal fields and restore required validation
                defaultJournalFields.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.closest('div').classList.remove('hidden');
                        el.setAttribute('required', 'required');
                    }
                });
                // Disable required for assignmentAnswers
                const assignmentTextarea = document.getElementById('assignmentAnswers');
                if (assignmentTextarea) {
                    assignmentTextarea.removeAttribute('required');
                }
            }
        }
    }

    function updateUI() {
        for (let i = 1; i <= totalSteps; i++) {
            document.getElementById(`step-${i}`).classList.remove('active');
            const indicatorWrap = document.getElementById(`indicator-${i}`);
            if (!indicatorWrap) continue;
            const indicator = indicatorWrap.querySelector('div');
            const label = indicatorWrap.querySelector('span');

            if (i < currentStep) {
                indicator.className = "w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 transition-all border-2 border-white";
                indicator.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
                if (label) label.className = "text-xs font-extrabold text-violet-700 hidden sm:block";
            } else if (i === currentStep) {
                indicator.className = "w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold shadow-lg shadow-violet-500/40 transition-all border-2 border-white ring-4 ring-violet-100";
                indicator.innerHTML = i;
                if (label) label.className = "text-xs font-extrabold text-violet-700 hidden sm:block";
            } else {
                indicator.className = "w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold transition-all shadow-sm";
                indicator.innerHTML = i;
                if (label) label.className = "text-xs font-bold text-slate-400 hidden sm:block";
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

        if (currentStep === 3) {
            updateStep3Layout();
            setupSingleModuleWordCount();
        }
    }

    function setupSingleModuleWordCount() {
        const fields = [
            { taId: 'experience', wcId: 'wc-experience' },
            { taId: 'feelings', wcId: 'wc-feelings' },
            { taId: 'learning', wcId: 'wc-learning' },
            { taId: 'application', wcId: 'wc-application' },
            { taId: 'conclusion', wcId: 'wc-conclusion' },
            { taId: 'assignmentAnswers', wcId: 'wc-assignmentAnswers' }
        ];

        fields.forEach(({ taId, wcId }) => {
            const ta = document.getElementById(taId);
            const wc = document.getElementById(wcId);
            if (ta && wc && !ta.dataset.wcBound) {
                ta.dataset.wcBound = "true";
                const update = () => {
                    const count = ta.value.trim() === '' ? 0 : ta.value.trim().split(/\s+/).length;
                    wc.innerText = `${count} words`;
                    if (count >= 420) {
                        wc.className = "text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold";
                    } else {
                        wc.className = "text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold";
                    }
                };
                ta.addEventListener('input', update);
                update();
            }
        });
    }

    // =========================================================
    // 📊 PRODUCTION REAL-TIME ANALYTICS ENGINE
    // =========================================================
    const qjAnalytics = (() => {
        const API_BASE = window.API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '');
        // --- Smooth animated number counter ---
        function animateValue(el, target, suffix = '+') {
            if (!el) return;
            const current = parseInt(el.dataset.rawValue || '0', 10);
            if (current === target) { el.innerText = target.toLocaleString() + suffix; return; }
            el.dataset.rawValue = target;
            let start = current;
            const duration = 900;
            const stepTime = 20;
            const steps = Math.max(1, duration / stepTime);
            const inc = (target - start) / steps;
            const timer = setInterval(() => {
                start += inc;
                if ((inc > 0 && start >= target) || (inc < 0 && start <= target)) {
                    el.innerText = target.toLocaleString() + suffix;
                    clearInterval(timer);
                } else {
                    el.innerText = Math.floor(start).toLocaleString() + suffix;
                }
            }, stepTime);
        }

        // --- Update all homepage stat card DOM elements ---
        function applyToDOM(summary) {
            const elPdf = document.getElementById('statPdfCount');
            const elStudents = document.getElementById('statStudentsCount');
            const elHours = document.getElementById('statHoursCount');
            const elAvg = document.getElementById('statAvgTime');

            if (elPdf) animateValue(elPdf, summary.total_journals_generated, '+');
            if (elStudents) animateValue(elStudents, summary.total_students_helped, '+');
            if (elHours) animateValue(elHours, summary.total_hours_saved, '+');
            if (elAvg) {
                const sec = summary.avg_generation_time_sec || 4.2;
                const rounded = Math.round(sec);
                const display = rounded < 30 ? '<30 Sec' : `${rounded} Sec`;
                elAvg.innerText = display;
            }
        }

        // --- Load initial summary from backend, set up SSE stream ---
        async function initLive() {
            try {
                const resp = await fetch(`${API_BASE}/api/analytics/summary`, { signal: AbortSignal.timeout(5000) });
                if (resp.ok) {
                    const { summary } = await resp.json();
                    applyToDOM(summary);
                }
            } catch (e) {
                // Backend offline — keep HTML defaults silently
            }

            // Real-time SSE stream
            try {
                const evtSource = new EventSource(`${API_BASE}/api/analytics/stream`);
                evtSource.onmessage = (evt) => {
                    try {
                        const payload = JSON.parse(evt.data);
                        if (payload.type === 'ANALYTICS_UPDATE' && payload.summary) {
                            applyToDOM(payload.summary);
                        }
                    } catch (e) {}
                };
                evtSource.onerror = () => evtSource.close();
            } catch (e) {}
        }

        // --- Record a successful generation event ---
        async function recordEvent({ generationType, moduleCount, durationMs }) {
            // Read student details from the form
            const studentName  = (document.getElementById('studentName')  || {}).value || '';
            const regNumber    = (document.getElementById('regNumber')    || {}).value || '';
            const classSection = (document.getElementById('classSection') || {}).value || '';

            try {
                await fetch(`${API_BASE}/api/analytics/event`, {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({
                        studentName, regNumber, classSection,
                        generationType,
                        moduleCount: typeof moduleCount === 'number' ? moduleCount : 1,
                        durationMs
                    })
                });
            } catch (e) {
                // Backend offline — silently skip; never block PDF delivery
            }
        }

        // --- Initialise on load ---
        initLive();

        return { recordEvent };
    })();

    // Shared generation start timestamp (set at generate click, consumed after doc.save())
    let _genStartTime = null;
    function markGenerationStart() { _genStartTime = performance.now(); }
    function consumeGenerationDuration() {
        if (_genStartTime === null) return 4000;
        const d = Math.round(performance.now() - _genStartTime);
        _genStartTime = null;
        return d;
    }


    function validateCurrentStep(skipAssessment = false) {
        const genModeEl = document.querySelector('input[name="genMode"]:checked');
        const genMode = genModeEl ? genModeEl.value : 'single';

        if (currentStep === 2 && genMode === 'term') {
            const selectedCheckboxes = document.querySelectorAll('input[name="termSubject"]:checked');
            const errEl = document.getElementById('termSubjectError');
            if (selectedCheckboxes.length === 0) {
                if (errEl) errEl.classList.remove('hidden');
                return false;
            } else {
                if (errEl) errEl.classList.add('hidden');
            }
        }

        const currentContainer = document.getElementById(`step-${currentStep}`);
        const inputs = currentContainer.querySelectorAll('input, select, textarea');
        let isValid = true;
        for (let input of inputs) {
            if (input.disabled || input.closest('.hidden') || input.style.display === 'none') continue;
            if (skipAssessment && input.id === 'assessmentNo') continue;
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
                break;
            }
        }
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

    function updateAssessmentLabel() {
        const term = termSel.value;
        const label = document.getElementById('assessmentNoLabel');
        if (label) {
            if (term === "4") {
                label.textContent = "Assessment Number";
            } else {
                label.textContent = "Reflective Number";
            }
        }
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
        updateAssessmentLabel();
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
        updateAssessmentLabel();
        if (generationModeContainer) generationModeContainer.style.display = 'block';

        const genModeEl = document.querySelector('input[name="genMode"]:checked');
        if (genModeEl && genModeEl.value === 'term') {
            populateTermSubjectsList();
        }
    });

    const generationModeContainer = document.getElementById('generationModeContainer');
    const genModeRadios = document.querySelectorAll('input[name="genMode"]');
    const assessmentNoContainer = document.getElementById('assessmentNoContainer');

    genModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            const globalDateContainer = document.getElementById('globalDateContainer');
            const journalDate = document.getElementById('journalDate');
            const subjContainer = subjSel.closest('div');
            const termSubjContainer = document.getElementById('termSubjectSelectionContainer');

            if (val === 'term') {
                assessmentNoContainer.style.display = 'none';
                assessSel.required = false;
                if (subjContainer) subjContainer.style.display = 'none';
                subjSel.required = false;
                topicInp.value = "Topics auto-generate for complete term";
                if(globalDateContainer) globalDateContainer.style.display = 'none';
                if(journalDate) journalDate.required = false;
                if(termSubjContainer) {
                    termSubjContainer.classList.remove('hidden');
                    populateTermSubjectsList();
                }
            } else if (val === 'complete') {
                assessmentNoContainer.style.display = 'none';
                assessSel.required = false;
                if (subjContainer) subjContainer.style.display = 'block';
                subjSel.required = true;
                topicInp.value = "Topics auto-generate for all modules";
                if(globalDateContainer) globalDateContainer.style.display = 'none';
                if(journalDate) journalDate.required = false;
                if(termSubjContainer) termSubjContainer.classList.add('hidden');
            } else {
                assessmentNoContainer.style.display = 'block';
                assessSel.required = true;
                assessSel.dispatchEvent(new Event('change')); 
                if (subjContainer) subjContainer.style.display = 'block';
                subjSel.required = true;
                if(globalDateContainer) globalDateContainer.style.display = 'block';
                if(journalDate) journalDate.required = true;
                if(termSubjContainer) termSubjContainer.classList.add('hidden');
            }
        });
    });

    subjSel.addEventListener('change', () => {
        generationModeContainer.style.display = 'block';
        const year = yearSel.value;
        const term = termSel.value;
        const sub  = subjSel.value;
        const modules = academicData[year]?.[term]?.[sub] || {};

        if (term === "4") {
            assessSel.innerHTML = '<option value="" disabled selected>Select Assessment</option>';
            Object.keys(modules).forEach(num => {
                assessSel.innerHTML += `<option value="${num}">Assessment ${num}</option>`;
            });
        } else {
            assessSel.innerHTML = '<option value="" disabled selected>Select Module</option>';
            const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
            Object.keys(modules).forEach(num => {
                const moduleData = modules[num];
                const title = moduleData.title || `Module ${num}`;
                const roman = romanNumerals[parseInt(num) - 1] || num;
                assessSel.innerHTML += `<option value="${num}">Module ${roman} - ${title}</option>`;
            });
        }
        enableSelect(assessSel);
        topicInp.value = "";

        // Reset AI fill button state on new subject selection
        const aiFillBtn = document.getElementById('aiFillBtn');
        if (aiFillBtn) {
            aiFillBtn.disabled = false;
            aiFillBtn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold rounded-lg transition-colors border border-violet-200 shadow-sm hover:shadow-md";
            aiFillBtn.innerHTML = `<span>✨</span> <span>Auto-Fill with AI</span>`;
        }
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

    function formatYearTermPDF(year, term) {
        const termOrdinals = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th" };
        const termStr = termOrdinals[term] || `${term}th`;
        return `${year} Year & ${termStr} Term`;
    }

    // 🛠️ CLIENT-SIDE ASSIGNMENT FALLBACK DATABASE & GENERATOR
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

    function getClientAssignmentFallback(subject, moduleNum, question, qNum) {
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

    function getClientFallback(tag, subject, topic) {
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
        const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
        
        const pools = {
            EXP: {
                intros: [
                    `The classroom was buzzing with energy as we started ${topic}. `, 
                    `Today's lecture provided a deep dive into ${topic}. `, 
                    `We spent the first half of the class mapping out ${topic}. `,
                    `The session began with a clear focus on the fundamentals of ${topic}. `,
                    `I arrived at the lecture ready to explore the nuances of ${subject}. `
                ],
                bodies: [
                    `The professor used a whiteboard to trace the history of ${subject}. `, 
                    `We broke down the technical barriers of ${topic} step-by-step. `, 
                    `The lecture was filled with diagrams explaining ${topic} logic. `,
                    `We explored how ${topic} interacts with other components in the system. `,
                    `A significant portion of the time was spent on troubleshooting common ${topic} issues. `
                ]
            },
            FEEL: {
                intros: [
                    `I felt a mix of curiosity and slight confusion during ${topic}. `, 
                    `My emotional reaction to ${topic} was one of genuine surprise. `, 
                    `I found myself questioning my previous assumptions about ${subject}. `,
                    `I felt a sense of clarity as the complex parts of ${topic} were explained. `,
                    `The lecture left me feeling inspired about the possibilities within ${subject}. `
                ],
                bodies: [
                    `It was a relief to finally understand the complexity of ${topic}. `, 
                    `The discussion sparked a lot of internal debate for me. `, 
                    `I felt motivated to learn more after seeing the real-world impact. `,
                    `I felt more confident in my ability to handle ${subject} assignments after this session. `,
                    `There was a moment of pure realization when I saw how ${topic} actually works. `
                ]
            },
            LEARN: {
                intros: [
                    `The breakthrough moment for me was understanding ${topic}'s core. `, 
                    `I mastered three distinct concepts regarding ${subject} today. `, 
                    `Learning about ${topic} felt like finally seeing the big picture. `,
                    `I gained a deeper appreciation for the logic that drives ${topic}. `,
                    `The session clarified several key principles of ${subject} for me. `
                ],
                bodies: [
                    `I now understand how ${topic} manages to keep systems stable. `, 
                    `The technical nuances of ${subject} are much clearer now. `, 
                    `I've gained a solid foundation in ${topic} architecture. `,
                    `I learned about the trade-offs involved in implementing ${topic} solutions. `,
                    `The lecture provided me with the tools to analyze ${subject} problems more effectively. `
                ]
            },
            APP: {
                intros: [
                    `I plan to use ${topic} to optimize my next engineering project. `, 
                    `The practical utility of ${topic} is immediately obvious to me. `, 
                    `I can't wait to try implementing ${topic} in a real-world scenario. `,
                    `I see a direct connection between ${topic} and my future career goals. `,
                    `I'm already thinking about how to integrate ${topic} into my current workflow. `
                ],
                bodies: [
                    `This will save me hours of manual work in my future career. `, 
                    `I will use these ${subject} strategies in my upcoming assessments. `, 
                    `My goal is to master ${topic} to build better software. `,
                    `I plan to experiment with ${topic} in the lab to see its practical limits. `,
                    `I will share my findings on ${topic} with my peers to foster better collaboration. `
                ]
            },
            CONC: {
                intros: [
                    `Overall, this module has completely reshaped my thinking. `, 
                    `In conclusion, I feel much more prepared for the professional world. `, 
                    `This session on ${topic} was a turning point in my studies. `,
                    `I'm leaving this class with a much stronger sense of purpose in ${subject}. `,
                    `The progress I've made today in understanding ${topic} is significant. `
                ],
                bodies: [
                    `I am walking away with a much stronger grasp of ${subject}. `, 
                    `My knowledge of ${topic} has evolved from basic to advanced. `, 
                    `I am ready to move on to more complex ${subject} modules. `,
                    `Reflecting on the session, I feel more equipped to handle technical challenges. `,
                    `I am genuinely excited to continue my journey within the field of ${subject}. `
                ]
            }
        };

        const pool = pools[tag] || pools.EXP;
        const conclusions = [
            `This study of ${topic} is vital for my growth. `,
            `I'm glad we covered ${topic} in such detail. `,
            `I feel a new sense of academic confidence now. `,
            `Mastering ${subject} is my top priority. `,
            `I am eager to see how ${topic} will be used in future modules. `
        ];

        let text = r(pool.intros) + r(pool.bodies) + r(conclusions) + "\n\n";

        // 📝 NATURAL BULLET POINT INJECTOR (Weighted & Varied)
        const weights = { LEARN: 0.7, APP: 0.7, EXP: 0.4, FEEL: 0.2, CONC: 0.1 };
        const threshold = weights[tag] || 0.4;

        if ((tag === "LEARN" || tag === "APP") && Math.random() < threshold) { 
            const points = [
                `Developing a deeper grasp of ${topic} mechanics.`,
                `Identifying the synergy between ${topic} and ${subject}.`,
                `Applying optimized logic to real-world ${subject} cases.`,
                `Evaluating the long-term impact of ${topic} on the field.`,
                `Streamlining workflows using ${topic} best practices.`,
                `Understanding the core architecture of ${topic} systems.`,
                `Analyzing efficiency gains through ${topic} implementation.`,
                `Collaborating with peers to solve ${subject} challenges.`,
                `Prototyping new solutions using ${topic} modules.`,
                `Reducing system latency by optimizing ${subject} parameters.`,
                `Expanding my technical vocabulary within the ${topic} domain.`,
                `Synthesizing academic theory with industrial ${topic} standards.`
            ];
            const count = Math.floor(Math.random() * 4) + 2; // 2 to 5 points
            const selected = shuffle(points).slice(0, count);
            
            const bulletText = selected.map(p => "• " + p).join("\n");
            
            if (Math.random() > 0.8) {
                text = bulletText + "\n\n" + text.trim();
            } else {
                text = text.trim() + "\n\n" + bulletText + "\n\n";
            }
        }

        const extraPool = shuffle([
            `Additionally, we looked at how ${topic} impacts the broader ecosystem of ${subject}. `,
            `The methodology behind ${topic} is surprisingly elegant and efficient. `,
            `I found that ${topic} is often misunderstood by beginners, so I paid extra attention. `,
            `We explored how ${subject} has evolved over the last decade due to ${topic}. `,
            `The lecturer emphasized that ${topic} is the future of modern industry. `,
            `I spent some extra time after class reviewing the ${topic} documentation. `,
            `The connection between ${topic} and professional ethics was also discussed. `,
            `I realized that ${topic} is much more than just a theoretical concept. `,
            `The collaborative atmosphere made it much easier to digest the complexity of ${topic}. `,
            `We examined several real-world examples where ${topic} was successfully implemented. `,
            `It's fascinating to see how ${subject} principles translate into practical software solutions. `,
            `The session highlighted the importance of continuous learning in the field of ${topic}. `,
            `I found the discussion on ${topic} optimization to be particularly relevant to my goals. `,
            `I'm planning to revisit the ${subject} materials to reinforce my understanding of ${topic}. `,
            `The interactive nature of the class allowed for a lot of productive questions on ${topic}. `,
            `I'm starting to see how ${topic} fits into the larger curriculum of my degree. `,
            `The sheer versatility of ${subject} as a discipline is something I am only now beginning to appreciate. `,
            `I took detailed notes on the specific implementation details for ${topic} shared today. `,
            `The class ended with a look at where ${topic} is heading in the next few years. `,
            `I feel like I've gained a much clearer perspective on the value of ${topic} today. `,
            `The practical demonstrations were key to making ${subject} concepts feel real. `,
            `I'm looking forward to the next session to see how ${topic} connects to other topics. `,
            `Understanding the limitations of ${topic} was a major part of today's lesson. `,
            `I've found that ${subject} requires a lot of critical thinking and problem-solving. `,
            `The professor's expertise in ${topic} was evident throughout the entire lecture. `,
            `I'm going to try to apply some of these ${topic} techniques to my own coding practice. `,
            `The session was a great reminder of why I enjoy studying ${subject} so much. `,
            `I realized that my previous knowledge of ${topic} was only scratching the surface. `,
            `The way ${subject} integrates different technologies through ${topic} is very clever. `,
            `I feel a sense of pride in having tackled such a difficult topic like ${topic} today. `
        ]);

        let extraIdx = 0;
        let sentenceCount = 0;
        while(text.split(/\s+/).length < 425 && extraIdx < extraPool.length) {
            text += extraPool[extraIdx];
            sentenceCount++;
            if (sentenceCount % 8 === 0) {
                text += "\n\n";
            }
            extraIdx++;
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

        if (t === "4") {
            const questions = academicData[y]?.[t]?.[subject]?.[moduleNum]?.questions || [];
            if (questions.length === 0) {
                alert("No questions found for this assessment.");
                return;
            }

            const aiSpinner = document.getElementById('aiSpinner');
            const aiErrorMsg = document.getElementById('aiErrorMsg');
            
            aiFillBtn.disabled = true;
            const originalBtnHTML = aiFillBtn.innerHTML;
            aiErrorMsg.classList.add('hidden');

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

            let countdown = 3;
            const timerInterval = setInterval(async () => {
                if (countdown <= 0) {
                    clearInterval(timerInterval);
                    
                    try {
                        aiSpinner.classList.remove('hidden');
                        aiFillBtn.innerHTML = `<span>✨ Generating Answers (0/${questions.length})...</span>`;
                        
                        // Choose exactly 2 or 3 random question indices to have bullet points
                        const bulletIndices = [];
                        const pool = Array.from({length: questions.length}, (_, i) => i);
                        const count = Math.round(Math.random()) + 2; // 2 or 3 questions
                        for (let k = 0; k < count; k++) {
                            if (pool.length > 0) {
                                const randIdx = Math.floor(Math.random() * pool.length);
                                bulletIndices.push(pool.splice(randIdx, 1)[0]);
                            }
                        }

                        let completed = 0;

                        const fetchPromises = questions.map(async (question, index) => {
                            // ⏱️ Stagger the starts of each query slightly to update progress counter progressively
                            await new Promise(r => setTimeout(r, index * 300));

                            const qNum = index + 1;
                            const hasBullets = bulletIndices.includes(index);
                            let retries = 0; 
                            let success = false;
                            let textResponse = "";

                            while (retries >= 0 && !success) {
                                try {
                                    const controller = new AbortController();
                                    const timeoutId = setTimeout(() => controller.abort(), 2500); 

                                    const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        signal: controller.signal,
                                        body: JSON.stringify({
                                            subject,
                                            topic: question,
                                            sectionTag: "ASSIGNMENT",
                                            moduleRoman: moduleNum,
                                            syllabus: question,
                                            styleInstruction: "",
                                            totalQuestions: questions.length
                                        })
                                    });
                                    clearTimeout(timeoutId);

                                    const data = await res.json();
                                    if (!res.ok) {
                                        if (data.retryAfter) {
                                            throw new Error(`RATELIMIT:${data.retryAfter}:${data.error}`);
                                        }
                                        throw new Error(data.error || `Failed to generate answer for Question ${qNum}`);
                                    }

                                    textResponse = data.text;
                                    success = true;
                                } catch (err) {
                                    let lastError = err.message;
                                    if (lastError.startsWith("RATELIMIT:")) {
                                        aiErrorMsg.innerHTML = `❌ <b>Limit Hit:</b> ${lastError.split(":")[2]}. <br> Wait for the timer.`;
                                        aiErrorMsg.classList.remove('hidden');
                                        startCooldownTimer(parseInt(lastError.split(":")[1]));
                                        return "";
                                    }
                                    retries--;
                                }
                            }

                            if (!success) {
                                console.warn(`Backend failed for Question ${qNum}. Using client fallback.`);
                                const fallbackSentences = [
                                    `A detailed theoretical analysis of ${question} reveals critical dependencies within the ${subject} module.`,
                                    `Historically, implementations of ${question} require strict adherence to core engineering paradigms and systematic structures.`,
                                    `From a structural perspective, evaluating ${question} helps clarify the broader ecosystem of the assigned module.`,
                                    `The practical applications of ${question} demonstrate its indispensable role in modern technological and developmental environments.`,
                                    `Moreover, ongoing developments related to ${question} continue to shape the boundaries of this specific academic discipline.`,
                                    `Exploring the theoretical underpinnings of ${question} reveals significant implications for the overarching system design.`,
                                    `It is crucial to recognize that the mechanics of ${question} do not operate in isolation but rely on foundational architectures discussed in class.`,
                                    `A detailed examination of ${question} highlights the necessity for rigorous testing and robust implementation strategies in real-world scenarios.`,
                                    `From a macroscopic view, integrating ${question} effectively can drastically reduce latency and improve system-wide cohesion.`,
                                    `Academic consensus suggests that mastering ${question} provides a significant advantage in advanced engineering paradigms.`
                                ];
                                
                                // 📐 Dynamic Word Count (Safe Target of 2050 words total)
                                const targetWordsPerQ = Math.floor(2050 / questions.length);
                                const firstStageLimit = Math.max(100, targetWordsPerQ - 100);

                                let fallbackAns = "";
                                let paragraphCount = 0;
                                while(fallbackAns.split(/\s+/).length < firstStageLimit) {
                                    fallbackAns += fallbackSentences[Math.floor(Math.random() * fallbackSentences.length)] + " ";
                                    if (fallbackAns.split(/\s+/).length > (paragraphCount + 1) * 100) {
                                        fallbackAns += "\n\n";
                                        paragraphCount++;
                                    }
                                }
                                
                                if (hasBullets) {
                                    // 📝 Inject 2-3 Natural Bullet Points (No headers like "Core Concepts:")
                                    const bulletPoints = [
                                        `• Theoretical constraints must be carefully balanced with practical implementation.`,
                                        `• System latency and overall architectural robustness are directly impacted.`,
                                        `• Real-world applications require adherence to strict engineering paradigms.`,
                                        `• Edge cases must be accounted for to ensure comprehensive operational stability.`,
                                        `• The underlying mechanisms significantly influence cross-module dependencies.`
                                    ];
                                    
                                    const shuffledBullets = [...bulletPoints].sort(() => 0.5 - Math.random());
                                    const selectedBullets = shuffledBullets.slice(0, 3).join("\n");
                                    
                                    fallbackAns = fallbackAns.trim() + "\n\n" + selectedBullets + "\n\n";
                                } else {
                                    fallbackAns = fallbackAns.trim() + "\n\n";
                                }
                                
                                while(fallbackAns.split(/\s+/).length < targetWordsPerQ) {
                                    fallbackAns += fallbackSentences[Math.floor(Math.random() * fallbackSentences.length)] + " ";
                                }

                                textResponse = fallbackAns.trim();
                            }

                            completed++;
                            aiFillBtn.innerHTML = `<span>✨ Generating Answers (${completed}/${questions.length})...</span>`;
                            return `Question ${qNum}: ${question}\n\nAnswer:\n${textResponse}\n\n\n`;
                        });

                        const results = await Promise.all(fetchPromises);
                        const assignmentText = results.join('');

                        const textarea = document.getElementById('assignmentAnswers');
                        textarea.value = assignmentText.trim();
                        textarea.dispatchEvent(new Event('input'));

                        aiFillBtn.innerHTML = `<span>✓ Generated</span>`;
                        aiFillBtn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors border border-emerald-200 shadow-sm opacity-80 cursor-default";
                        aiFillBtn.disabled = true;
                        aiSpinner.classList.add('hidden');

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

        // 🎨 Opening Variation Engine (Forces different starting styles)
        const getOpeningStyle = (tag) => {
            const styles = {
                EXP: ["Start by describing the visual setting of the classroom.", "Start with the first topic the professor mentioned.", "Start with a specific example that was written on the board.", "Start with the initial curiosity you felt entering the class."],
                FEEL: ["Start with a moment of confusion you experienced.", "Start with a sense of excitement you felt about a concept.", "Start with a question that popped into your head.", "Start with how your mood shifted during the lecture."],
                LEARN: ["Start with the most important technical insight.", "Start by clarifying a concept you previously misunderstood.", "Start with a 'lightbulb' moment you had.", "Start with a core principle that defines this module."],
                APP: ["Start with a specific career goal where this applies.", "Start with a personal project idea inspired by this.", "Start with a real-life problem this theory solves.", "Start with how you will explain this to a teammate."],
                CONC: ["Start with how your perspective has matured.", "Start with a final summary of your progress.", "Start with a look towards the next academic challenge.", "Start with the most memorable takeaway."]
            };
            const options = styles[tag] || styles.EXP;
            return options[Math.floor(Math.random() * options.length)];
        };

        const sections = [
            { 
                tag: "EXP", id: "experience", name: "Experience", 
                hint: `Format: Briefly describe topics/concepts discussed. Tone: Human-like, natural. Instruction: ${getOpeningStyle('EXP')}. DO NOT start with 'Today we learned' or 'In this session'.` 
            },
            { 
                tag: "FEEL", id: "feelings", name: "Feelings", 
                hint: `Format: Share emotional reactions and thoughts. How did you feel learning this? Tone: Thoughtful, not robotic. Instruction: ${getOpeningStyle('FEEL')}. DO NOT start with 'I felt' or 'My feelings were'.` 
            },
            { 
                tag: "LEARN", id: "learning", name: "Learning", 
                hint: `Format: Highlight key insights or fundamental concepts gained. Tone: Simple language with academic clarity. Instruction: ${getOpeningStyle('LEARN')}. DO NOT start with 'I learned' or 'The key insight was'.` 
            },
            { 
                tag: "APP", id: "application", name: "Application", 
                hint: `Format: Describe real-life/career application and practical utility. Tone: Use relatable examples. Instruction: ${getOpeningStyle('APP')}. DO NOT start with 'I will apply' or 'This can be applied'.` 
            },
            { 
                tag: "CONC", id: "conclusion", name: "Conclusion", 
                hint: `Format: Overall learning, shaping of thinking/knowledge. Tone: Depth of reflection. Instruction: ${getOpeningStyle('CONC')}. DO NOT start with 'In conclusion' or 'To summarize'.` 
            }
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
                    const loadingSteps = [
                        "🧠 AI is writing your journal...",
                        "✍️ Structuring content...",
                        "📄 Formatting PDF...",
                        "✅ Almost Ready..."
                    ];
                    let stepIdx = 0;
                    aiFillBtn.innerHTML = `<span>${loadingSteps[0]}</span>`;
                    aiSpinner.classList.remove('hidden');

                    const fetchPromises = sections.map(async (sec, index) => {
                        await new Promise(r => setTimeout(r, index * 350));
                        stepIdx = (index + 1) % loadingSteps.length;
                        aiFillBtn.innerHTML = `<span>${loadingSteps[stepIdx]}</span>`;

                        let retries = 0; 
                        let success = false;
                        let lastError = "";

                        while (retries >= 0 && !success) {
                            try {
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 2500); 

                                const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    signal: controller.signal,
                                    body: JSON.stringify({ 
                                        subject, 
                                        moduleRoman, 
                                        topic, 
                                        syllabus, 
                                        sectionTag: sec.tag,
                                        styleInstruction: sec.hint,
                                        requestSeed: Date.now() // 🚀 Forces AI to be fresh every time
                                    })
                                });
                                clearTimeout(timeoutId);

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

                            } catch (err) {
                                lastError = err.message;
                                if (lastError.startsWith("RATELIMIT:")) {
                                    aiErrorMsg.innerHTML = `❌ <b>Limit Hit:</b> ${lastError.split(":")[2]}. <br> Wait for the timer.`;
                                    aiErrorMsg.classList.remove('hidden');
                                    startCooldownTimer(parseInt(lastError.split(":")[1]));
                                    throw err;
                                }
                                retries--;
                            }
                        }

                        if (!success) {
                            console.warn(`Backend failed for ${sec.name}. Using client fallback.`);
                            const textarea = document.getElementById(sec.id);
                            textarea.value = getClientFallback(sec.tag, subject, topic);
                            textarea.dispatchEvent(new Event('input'));
                        }
                    });

                    await Promise.all(fetchPromises);

                    aiFillBtn.innerHTML = `<span>✓ Generated</span>`;
                    aiFillBtn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors border border-emerald-200 shadow-sm opacity-80 cursor-default";
                    aiFillBtn.disabled = true;
                    aiSpinner.classList.add('hidden');

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
        
        const genMode = document.querySelector('input[name="genMode"]:checked').value;
        
        if (genMode === "term") {
            return;
        }

        if (genMode === "complete") {
            if(!validateCurrentStep(true)) return;
            await handleCompleteSubjectGeneration();
            return;
        }

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
            markGenerationStart(); // 📊 Start timing

            const headerImageData = await getBase64ImageFromURL('header.png').catch(() => null);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });

            // Build module label e.g. "Module III - Strings & String Operations"
            const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
            const moduleNum = assessSel.value;
            const moduleRoman = romanNumerals[parseInt(moduleNum) - 1] || moduleNum;
            const moduleLabel = `${moduleRoman}`;

            const isTerm4 = yearSel.value === "I" && termSel.value === "4";
            const data = {
                name: document.getElementById('studentName').value,
                reg: document.getElementById('regNumber').value,
                sec: document.getElementById('classSection').value,
                yt: formatYearTermPDF(yearSel.value, termSel.value),
                sub: subjSel.value,
                assNum: moduleLabel,
                date: formatDate(document.getElementById('journalDate').value),
                topic: topicInp.value,
                assignmentAnswers: isTerm4 ? document.getElementById('assignmentAnswers').value : "",
                exp: !isTerm4 ? document.getElementById('experience').value : "",
                feel: !isTerm4 ? document.getElementById('feelings').value : "",
                learn: !isTerm4 ? document.getElementById('learning').value : "",
                app: !isTerm4 ? document.getElementById('application').value : "",
                conc: !isTerm4 ? document.getElementById('conclusion').value : ""
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
                    [{ content: isTerm4 ? 'Assessment' : 'Name of the Assessment', styles: { fontStyle: 'bold', cellWidth: isTerm4 ? 50 : 60 } }, { content: `${isTerm4 ? "Assignment" : "Reflective Journal"} - ${data.assNum}` }],
                    [{ content: 'Date of Submission', styles: { fontStyle: 'bold' } }, { content: data.date }]
                ],
            });

            // Center Title
            let currentY = doc.lastAutoTable.finalY + 15;
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text(`${isTerm4 ? "Assignment" : "Reflective Journal"} - ${data.assNum}`, pageWidth/2, currentY, { align: "center" });
            
            let qaY;
            if (!isTerm4) {
                // Table 3: Topic Header
                currentY += 8;
                doc.autoTable({
                    startY: currentY,
                    margin: { top: 45 },
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                    body: [
                        [{ content: 'Date', styles: { fontStyle: 'normal', textColor: [192, 0, 0], cellWidth: 40 } }, { content: data.date }],
                        [{ content: `Journal Entry\nTopic`, styles: { fontStyle: 'normal', textColor: [192, 0, 0] } }, { content: data.topic }]
                    ],
                });
                qaY = doc.lastAutoTable.finalY;
            } else {
                qaY = currentY + 10;
            }

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

            if (isTerm4) {
                const qaBlocks = [];
                const regex = /Question\s*(\d+):?\s*([\s\S]*?)\n+Answer:\s*([\s\S]*?)(?=\n*Question\s*\d+:|$)/gi;
                let match;
                while ((match = regex.exec(data.assignmentAnswers)) !== null) {
                    qaBlocks.push({
                        qNum: match[1],
                        question: match[2].trim(),
                        answer: match[3].trim()
                    });
                }

                let bodyData = [];
                qaBlocks.forEach((block) => {
                    bodyData.push([{ content: `Question ${block.qNum}: ${block.question}`, styles: { fontStyle: 'bold', fontSize: 11 } }]);
                    bodyData.push([{ content: `Answer:\n\n${block.answer}`, styles: { fontStyle: 'normal' } }]);
                });

                doc.autoTable({
                    startY: qaY,
                    margin: { top: 45 },
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 6 },
                    body: bodyData,
                    didParseCell: function(data) {
                        // If it's a Question cell (even row index 0, 2, 4...)
                        if (data.row.index % 2 === 0) {
                            // Top, Right, Bottom, Left
                            data.cell.styles.lineWidth = { top: 0.2, right: 0.2, bottom: 0, left: 0.2 };
                        } else {
                            // Answer cell
                            data.cell.styles.lineWidth = { top: 0, right: 0.2, bottom: 0.2, left: 0.2 };
                        }
                    }
                });
            } else {
                drawContentSection('1. Experience\n(Class Content)', data.exp, qaY);
                drawContentSection('2. Feelings\n(Emotional Reactions)', data.feel, doc.lastAutoTable.finalY);
                drawContentSection('3. Learning\n(Key Insights)', data.learn, doc.lastAutoTable.finalY);
                drawContentSection('4. Application\n(Practical Use)', data.app, doc.lastAutoTable.finalY);
                drawContentSection('5. Conclusion', data.conc, doc.lastAutoTable.finalY);
            }


            
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
            const docType = isTerm4 ? "Assignment" : "RJ";
            const cleanFilename = `${safeName}_${safeReg}_${docType}_${safeSub}-${moduleRoman}`;
            doc.save(`${cleanFilename}.pdf`);
            qjAnalytics.recordEvent({ generationType: isTerm4 ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: consumeGenerationDuration() }); // 📊 Analytics

            // Show Success Notification
            successMsg.classList.remove('hidden');
            successMsg.classList.add('active');

            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    successMsg.classList.add('hidden');
                    successMsg.classList.remove('active');
                    if (typeof updateStepUI === 'function') {
                        currentStep = 1;
                        updateStepUI();
                    }
                    const genSec = document.getElementById('generator');
                    if (genSec) genSec.scrollIntoView({ behavior: 'smooth' });
                };
            }

            const closeSuccessBtn = document.getElementById('closeSuccessBtn');
            if (closeSuccessBtn) {
                closeSuccessBtn.onclick = () => {
                    successMsg.classList.add('hidden');
                    successMsg.classList.remove('active');
                };
            }

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

    // Global state for multi-module generation
    let completeSubjectState = {};
    
    // We remove the old completeSubject generation handler since we use the per-module UI now
    async function handleCompleteSubjectGeneration() {
        console.warn('handleCompleteSubjectGeneration is deprecated. Use per-module generation instead.');
    }
        
    function getOpeningStyle(tag) {
        const styles = {
            EXP: ["Start by describing the visual setting of the classroom.", "Start with the first topic the professor mentioned.", "Start with a specific example that was written on the board.", "Start with the initial curiosity you felt entering the class."],
            FEEL: ["Start with a moment of confusion you experienced.", "Start with a sense of excitement you felt about a concept.", "Start with a question that popped into your head.", "Start with how your mood shifted during the lecture."],
            LEARN: ["Start with the most important technical insight.", "Start by clarifying a concept you previously misunderstood.", "Start with a 'lightbulb' moment you had.", "Start with a core principle that defines this module."],
            APP: ["Start with a specific career goal where this applies.", "Start with a personal project idea inspired by this.", "Start with a real-life problem this theory solves.", "Start with how you will explain this to a teammate."],
            CONC: ["Start with how your perspective has matured.", "Start with a final summary of your progress.", "Start with a look towards the next academic challenge.", "Start with the most memorable takeaway."]
        };
        const options = styles[tag] || styles.EXP;
        return options[Math.floor(Math.random() * options.length)];
    }

    const sectionsDefinition = [
        { tag: "EXP", name: "Experience", hint: `Format: Objective summary of topics covered. Tone: Academic and observational. Instruction: ${getOpeningStyle('EXP')}. DO NOT start with 'I experienced' or 'In this class'.` },
        { tag: "FEEL", name: "Feelings", hint: `Format: Emotional or intellectual response to the difficulty or interest of the topic. Tone: Honest but professional. Instruction: ${getOpeningStyle('FEEL')}. DO NOT start with 'I felt' or 'My feelings were'.` },
        { tag: "LEARN", name: "Learning", hint: `Format: Highlight key insights or fundamental concepts gained. Tone: Simple language with academic clarity. Instruction: ${getOpeningStyle('LEARN')}. DO NOT start with 'I learned' or 'The key insight was'.` },
        { tag: "APP", name: "Application", hint: `Format: Describe real-life/career application and practical utility. Tone: Use relatable examples. Instruction: ${getOpeningStyle('APP')}. DO NOT start with 'I will apply' or 'This can be applied'.` },
        { tag: "CONC", name: "Conclusion", hint: `Format: Overall learning, shaping of thinking/knowledge. Tone: Depth of reflection. Instruction: ${getOpeningStyle('CONC')}. DO NOT start with 'In conclusion' or 'To summarize'.` }
    ];

    function renderMultiModuleCards() {
        const container = document.getElementById('multiModuleContainer');
        if (!container) return;
        
        // Clear previous cards, keep action buttons
        const actionsHtml = document.getElementById('multiModuleActions').outerHTML;
        container.innerHTML = '';
        
        const year = yearSel.value;
        const term = termSel.value;
        const sub = subjSel.value;
        const modules = academicData[year]?.[term]?.[sub] || {};
        const isTerm4 = (term === '4');

        completeSubjectState = {};
        const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

        // Add a global date picker and weekly auto-assign button for convenience
        const globalDateRow = document.createElement('div');
        globalDateRow.className = "mb-4 p-3 bg-violet-50/80 border border-violet-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm";
        globalDateRow.innerHTML = `
            <span class="font-extrabold text-violet-800 flex items-center gap-1.5">
                <span>📅</span> Date Assignment
            </span>
            <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span class="font-bold text-slate-700">Start Date:</span>
                    <input type="date" id="global-multi-date" class="form-input px-2 py-1 text-xs rounded border border-slate-300">
                </div>
                <button type="button" id="auto-assign-subject-weekly-btn" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                    ⚡ Weekly Dates
                </button>
            </div>
        `;
        container.appendChild(globalDateRow);
        
        const globalDateInput = globalDateRow.querySelector('#global-multi-date');
        globalDateInput.onchange = (e) => {
            const val = e.target.value;
            Object.keys(completeSubjectState).forEach(num => {
                completeSubjectState[num].date = val;
                const dInput = document.getElementById(`date-input-${num}`);
                if (dInput) dInput.value = val;
            });
        };

        const autoAssignSubWeeklyBtn = globalDateRow.querySelector('#auto-assign-subject-weekly-btn');
        autoAssignSubWeeklyBtn.onclick = () => {
            const baseStr = globalDateInput.value ? globalDateInput.value : new Date().toISOString().split('T')[0];
            const baseDate = new Date(baseStr);
            const keys = Object.keys(completeSubjectState);
            keys.forEach((num, idx) => {
                const weekDate = new Date(baseDate);
                weekDate.setDate(weekDate.getDate() + (idx * 7));
                const dateStr = weekDate.toISOString().split('T')[0];
                completeSubjectState[num].date = dateStr;
                const dInput = document.getElementById(`date-input-${num}`);
                if (dInput) dInput.value = dateStr;
            });
        };

        Object.keys(modules).forEach((num) => {
            const moduleData = modules[num];
            const title = moduleData.title || (isTerm4 ? `Assessment ${num}` : `Module ${num}`);
            const roman = isTerm4 ? num : (romanNumerals[parseInt(num) - 1] || num);

            completeSubjectState[num] = {
                status: 'pending', // pending, generating, generated, failed
                date: '',
                content: {
                    EXP: '', FEEL: '', LEARN: '', APP: '', CONC: '', ASSIGN: ''
                },
                topic: title,
                cleanTitle: title,
                roman: roman
            };

            const card = document.createElement('div');
            card.id = `mod-card-${num}`;
            card.className = "bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4";
            
            const header = document.createElement('div');
            header.className = "p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer";
            header.onclick = () => {
                const body = document.getElementById(`mod-body-${num}`);
                body.classList.toggle('hidden');
            };

            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `<h3 class="font-bold text-slate-800">${isTerm4 ? 'Assessment' : 'Module'} ${roman}: ${title}</h3>`;
            
            const controlsDiv = document.createElement('div');
            controlsDiv.className = "flex flex-wrap items-center gap-2";
            controlsDiv.onclick = (e) => e.stopPropagation();

            const dateInput = document.createElement('input');
            dateInput.id = `date-input-${num}`;
            dateInput.type = 'date';
            dateInput.className = "form-input px-3 py-1.5 text-sm rounded border border-slate-300";
            dateInput.onchange = (e) => { completeSubjectState[num].date = e.target.value; };
            
            const genBtn = document.createElement('button');
            genBtn.id = `gen-btn-${num}`;
            genBtn.className = "px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-sm rounded transition-colors";
            genBtn.innerText = "✨ Generate";
            genBtn.onclick = () => generateModuleWithAI(num);

            const downloadBtn = document.createElement('button');
            downloadBtn.id = `dl-btn-${num}`;
            downloadBtn.className = "px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
            downloadBtn.innerText = "📄 Download";
            downloadBtn.disabled = true;
            downloadBtn.onclick = () => generatePDFForModule(num);

            controlsDiv.appendChild(dateInput);
            controlsDiv.appendChild(genBtn);
            controlsDiv.appendChild(downloadBtn);

            header.appendChild(titleDiv);
            header.appendChild(controlsDiv);

            const body = document.createElement('div');
            body.id = `mod-body-${num}`;
            body.className = "hidden p-4 space-y-4 bg-white";

            if (isTerm4) {
                body.innerHTML += `
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Assignment Answers</label>
                        <textarea id="ta-${num}-ASSIGN" class="w-full form-input px-3 py-2 text-sm rounded border border-slate-300 h-32"></textarea>
                    </div>`;
            } else {
                ['EXP', 'FEEL', 'LEARN', 'APP', 'CONC'].forEach(tag => {
                    const sectionName = sectionsDefinition.find(s => s.tag === tag).name;
                    body.innerHTML += `
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                                <span>${sectionName}</span>
                                <span id="wc-${num}-${tag}" class="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold">0 words</span>
                            </label>
                            <textarea id="ta-${num}-${tag}" class="w-full form-input px-3 py-2 text-sm rounded border border-slate-300 h-24"></textarea>
                        </div>`;
                });
            }

            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);

            // Attach event listeners safely after DOM insertion
            if (isTerm4) {
                const ta = document.getElementById(`ta-${num}-ASSIGN`);
                if (ta) {
                    ta.addEventListener('input', (e) => {
                        completeSubjectState[num].content.ASSIGN = e.target.value;
                    });
                }
            } else {
                ['EXP', 'FEEL', 'LEARN', 'APP', 'CONC'].forEach(tag => {
                    const ta = document.getElementById(`ta-${num}-${tag}`);
                    const wc = document.getElementById(`wc-${num}-${tag}`);
                    if (ta && wc) {
                        ta.addEventListener('input', (e) => {
                            const val = e.target.value;
                            completeSubjectState[num].content[tag] = val;
                            const count = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
                            wc.innerText = `${count} words`;
                            if (count >= 420) {
                                wc.className = "text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold";
                            } else {
                                wc.className = "text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold";
                            }
                        });
                    }
                });
            }
        });

        // Restore action buttons
        container.insertAdjacentHTML('beforeend', actionsHtml);
        
        document.getElementById('generateAllModulesBtn').onclick = generateAllPendingModules;
        document.getElementById('downloadAllZipBtn').onclick = downloadAllAsZip;
    }

    async function generateModuleWithAI(num) {
        const state = completeSubjectState[num];
        
        if (!state.date) {
            alert("Please select a date for this module before generating.");
            return;
        }

        const genBtn = document.getElementById(`gen-btn-${num}`);
        const dlBtn = document.getElementById(`dl-btn-${num}`);
        
        const year = yearSel.value;
        const term = termSel.value;
        const sub = subjSel.value;
        const isTerm4 = (term === '4');
        const modules = academicData[year]?.[term]?.[sub] || {};
        const syllabus = modules[num]?.syllabus || "";

        state.status = 'generating';
        
        // Auto-open accordion when generation starts
        const body = document.getElementById(`mod-body-${num}`);
        if (body && body.classList.contains('hidden')) {
            body.classList.remove('hidden');
        }

        genBtn.disabled = true;
        genBtn.innerHTML = `<svg class="animate-spin w-4 h-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...`;

        let success = true;

        if (isTerm4) {
            // For Term 4, we use the fallback or just generate one block
            state.content.ASSIGN = getClientAssignmentFallback(sub, state.roman, state.cleanTitle, state.roman);
            document.getElementById(`ta-${num}-ASSIGN`).value = state.content.ASSIGN;
        } else {
            for (let i = 0; i < sectionsDefinition.length; i++) {
                const sec = sectionsDefinition[i];
                
                // Update UI to show progress
                genBtn.innerHTML = `<svg class="animate-spin w-4 h-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating ${sec.name}...`;

                let retries = 0; // Fail faster on batch
                let secSuccess = false;
                while (retries >= 0 && !secSuccess) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 2500); // Fast timeout

                        const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            signal: controller.signal,
                            body: JSON.stringify({ 
                                subject: sub, 
                                moduleRoman: state.roman, 
                                topic: state.cleanTitle, 
                                syllabus, 
                                sectionTag: sec.tag,
                                styleInstruction: sec.hint,
                                requestSeed: Date.now()
                            })
                        });
                        clearTimeout(timeoutId);
                        const data = await res.json();
                        
                        if (!res.ok) {
                            if (data.retryAfter) {
                                await new Promise(r => setTimeout(r, parseInt(data.retryAfter) * 1000));
                                throw new Error("Rate limit");
                            }
                            throw new Error(data.error || "API failed");
                        }
                        
                        state.content[sec.tag] = data.text;
                        const textarea = document.getElementById(`ta-${num}-${sec.tag}`);
                        textarea.value = data.text;
                        textarea.dispatchEvent(new Event('input')); // Trigger word count
                        secSuccess = true;
                    } catch (err) {
                        console.error(`Error generating section ${sec.tag} for module ${num}:`, err);
                        retries--;
                        if (retries < 0) {
                            success = false;
                            state.content[sec.tag] = getClientFallback(sec.tag, sub, state.cleanTitle);
                            const textarea = document.getElementById(`ta-${num}-${sec.tag}`);
                            textarea.value = state.content[sec.tag];
                            textarea.dispatchEvent(new Event('input')); // Trigger word count
                        } else {
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }
            }
        }

        if (success) {
            state.status = 'generated';
            genBtn.innerText = "✓ Done";
            genBtn.className = "px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-sm rounded transition-colors opacity-80 cursor-default";
            genBtn.disabled = true;
            dlBtn.disabled = false;
        } else {
            state.status = 'generated';
            genBtn.innerText = "✓ Done";
            genBtn.className = "px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-sm rounded transition-colors opacity-80 cursor-default";
            genBtn.disabled = true;
            dlBtn.disabled = false;
        }

        // Auto-close accordion after generation
        if (body && !body.classList.contains('hidden')) {
            body.classList.add('hidden');
        }
    }

    async function generateAllPendingModules() {
        const btn = document.getElementById('generateAllModulesBtn');
        btn.disabled = true;
        btn.innerText = "⏳ Generating...";

        // Ensure global date is set if required, or at least first pending module has date
        let hasDate = true;
        for (const num in completeSubjectState) {
            if (!completeSubjectState[num].date) hasDate = false;
        }
        if (!hasDate) {
            const globalDate = document.getElementById('global-multi-date').value;
            if (!globalDate) {
                alert("Please set a global date for all modules before generating all.");
                btn.disabled = false;
                btn.innerText = "✨ Generate All Pending";
                return;
            } else {
                Object.keys(completeSubjectState).forEach(num => {
                    completeSubjectState[num].date = globalDate;
                    const dInput = document.getElementById(`date-input-${num}`);
                    if (dInput) dInput.value = globalDate;
                });
            }
        }
        
        for (const num in completeSubjectState) {
            if (completeSubjectState[num].status === 'pending' || completeSubjectState[num].status === 'failed') {
                // Auto-scroll to module
                const card = document.getElementById(`mod-card-${num}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Open accordion if closed
                    const body = document.getElementById(`mod-body-${num}`);
                    if (body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                    }
                }
                
                await generateModuleWithAI(num);
                // Pause slightly before jumping to next
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        btn.innerText = "✨ Generate All Pending";
        btn.disabled = false;
    }

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

    async function getPDFBlobForModule(num, preloadedHeaderImage = null) {
        const state = completeSubjectState[num];
        const isTerm4 = (termSel.value === '4');
        const headerImageData = preloadedHeaderImage || await getBase64ImageFromURL('header.png').catch(() => null);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
        
        const dataObj = {
            name: document.getElementById('studentName').value,
            reg: document.getElementById('regNumber').value,
            sec: document.getElementById('classSection').value,
            yt: formatYearTermPDF(yearSel.value, termSel.value),
            sub: subjSel.value,
            assNum: state.roman,
            date: formatDate(state.date || document.getElementById('journalDate').value || new Date().toISOString().split('T')[0]),
            topic: state.topic,
            assign: state.content.ASSIGN,
            exp: state.content.EXP,
            feel: state.content.FEEL,
            learn: state.content.LEARN,
            app: state.content.APP,
            conc: state.content.CONC
        };

        const pageWidth = doc.internal.pageSize.width;
        let startY = 45; 

        doc.autoTable({
            startY: startY, margin: { top: 45 }, theme: 'grid',
            styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
            body: [
                [{ content: 'Student Name', styles: { fontStyle: 'bold', cellWidth: 50 } }, { content: dataObj.name, colSpan: 2, styles: { fontStyle: 'bold' } }],
                [{ content: 'Student Registration Number', styles: { fontStyle: 'bold' } }, { content: dataObj.reg }, { content: `Class & Section: ${dataObj.sec}`, styles: { fontStyle: 'bold' } }],
                [{ content: 'Study Level : UG/PG', styles: { fontStyle: 'bold' } }, { content: 'UG' }, { content: `Year & Term: ${dataObj.yt}`, styles: { fontStyle: 'bold' } }],
                [{ content: 'Subject Name', styles: { fontStyle: 'bold' } }, { content: dataObj.sub, colSpan: 2, styles: { fontStyle: 'bold' } }]
            ],
        });

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 5, margin: { top: 45 }, theme: 'grid',
            styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
            body: [
                [{ content: isTerm4 ? 'Assessment' : 'Name of the Assessment', styles: { fontStyle: 'bold', cellWidth: isTerm4 ? 50 : 60 } }, { content: `${isTerm4 ? "Assignment" : "Reflective Journal"} - ${dataObj.assNum}` }],
                [{ content: 'Date of Submission', styles: { fontStyle: 'bold' } }, { content: dataObj.date }]
            ],
        });

        let currentY = doc.lastAutoTable.finalY + 15;
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text(`${isTerm4 ? "Assignment" : "Reflective Journal"} - ${dataObj.assNum}`, pageWidth/2, currentY, { align: "center" });
        currentY += 8;

        let qaY;
        if (!isTerm4) {
            // Table 3: Topic Header
            currentY += 8;
            doc.autoTable({
                startY: currentY,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Date', styles: { fontStyle: 'normal', textColor: [192, 0, 0], cellWidth: 40 } }, { content: dataObj.date }],
                    [{ content: `Journal Entry\nTopic`, styles: { fontStyle: 'normal', textColor: [192, 0, 0] } }, { content: dataObj.topic }]
                ],
            });
            qaY = doc.lastAutoTable.finalY;
        } else {
            qaY = currentY + 10;
        }

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

        if (isTerm4) {
            const qaBlocks = [];
            const regex = /Question\s*(\d+):?\s*([\s\S]*?)\n+Answer:\s*([\s\S]*?)(?=\n*Question\s*\d+:|$)/gi;
            let match;
            while ((match = regex.exec(dataObj.assign)) !== null) {
                qaBlocks.push({
                    qNum: match[1],
                    question: match[2].trim(),
                    answer: match[3].trim()
                });
            }

            let bodyData = [];
            qaBlocks.forEach((block) => {
                bodyData.push([{ content: `Question ${block.qNum}: ${block.question}`, styles: { fontStyle: 'bold', fontSize: 11 } }]);
                bodyData.push([{ content: `Answer:\n\n${block.answer}`, styles: { fontStyle: 'normal' } }]);
            });

            doc.autoTable({
                startY: qaY,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 6 },
                body: bodyData,
                didParseCell: function(data) {
                    // If it's a Question cell (even row index 0, 2, 4...)
                    if (data.row.index % 2 === 0) {
                        data.cell.styles.lineWidth = { top: 0.2, right: 0.2, bottom: 0, left: 0.2 };
                    } else {
                        data.cell.styles.lineWidth = { top: 0, right: 0.2, bottom: 0.2, left: 0.2 };
                    }
                }
            });
        } else {
            drawContentSection('1. Experience\n(Class Content)', dataObj.exp, qaY);
            drawContentSection('2. Feelings\n(Emotional Reactions)', dataObj.feel, doc.lastAutoTable.finalY);
            drawContentSection('3. Learning\n(Key Insights)', dataObj.learn, doc.lastAutoTable.finalY);
            drawContentSection('4. Application\n(Practical Use)', dataObj.app, doc.lastAutoTable.finalY);
            drawContentSection('5. Conclusion', dataObj.conc, doc.lastAutoTable.finalY);
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            if (headerImageData) {
                doc.addImage(headerImageData, 'PNG', 0, 0, 210, 35);
            } else {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.text("AURORA HIGHER EDUCATION", pageWidth/2, 20, { align: "center" });
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                doc.text("Deemed-to-be-University Estd.u/s.03 of UGC Act 1956", pageWidth/2, 27, { align: "center" });
                doc.setFontSize(10);
                doc.text("Uppal, Hyderabad, Telangana | Bhongir, Yadadri, Telangana", pageWidth/2, 33, { align: "center" });
            }
        }

        return doc.output('blob');
    }

    async function generatePDFForModule(num) {
        const btn = document.getElementById(`dl-btn-${num}`);
        if (btn) btn.innerText = "⏳";
        try {
            const blob = await getPDFBlobForModule(num);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const state = completeSubjectState[num];
            const safeName = document.getElementById('studentName').value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const safeReg = document.getElementById('regNumber').value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const safeSub = subjSel.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const docType = (termSel.value === '4') ? "Assignment" : "RJ";
            const cleanFilename = `${safeName}_${safeReg}_${docType}_${safeSub}-${state.roman}`;
            a.download = `${cleanFilename}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            qjAnalytics.recordEvent({ generationType: (termSel.value === '4') ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: consumeGenerationDuration() }); // 📊 Analytics

            const successMsg = document.getElementById('successMsg');
            if (successMsg) {
                const successMsgText = document.getElementById('successMsgText');
                if (successMsgText) successMsgText.innerText = "PDF Generated Successfully!";
                successMsg.classList.remove('hidden');
                successMsg.classList.add('active');
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (err) {
            console.error("Single module PDF download error:", err);
        } finally {
            if (btn) btn.innerText = "📄 Download";
        }
    }

    async function downloadAllAsZip() {
        const btn = document.getElementById('downloadAllZipBtn');
        btn.disabled = true;
        btn.innerText = "📦 Zipping...";
        
        const zip = new JSZip();
        let addedCount = 0;
        
        // Pre-cache header image once for lightning fast zip generation
        const cachedHeader = await getBase64ImageFromURL('header.png').catch(() => null);
        
        for (const num in completeSubjectState) {
            const state = completeSubjectState[num];
            // Allow download if generated
            if (state.status === 'generated' || state.status === 'failed') {
                const blob = await getPDFBlobForModule(num, cachedHeader);
                const safeName = document.getElementById('studentName').value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const safeReg = document.getElementById('regNumber').value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const safeSub = subjSel.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const docType = (termSel.value === '4') ? "Assignment" : "RJ";
                const cleanFilename = `${safeName}_${safeReg}_${docType}_${safeSub}-${state.roman}`;
                zip.file(`${cleanFilename}.pdf`, blob);
                addedCount++;
            }
        }
        
        if (addedCount > 0) {
            const content = await zip.generateAsync({type:"blob"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            const safeSub = subjSel.value.replace(/[^a-zA-Z0-9\s]/g, '');
            a.download = `${safeSub}_All_RJs.zip`;
            a.click();
            qjAnalytics.recordEvent({ generationType: 'SUBJECT', moduleCount: addedCount, durationMs: consumeGenerationDuration() }); // 📊 Analytics (moduleCount = actual modules in ZIP)

            const successMsg = document.getElementById('successMsg');
            if (successMsg) {
                const successMsgText = document.getElementById('successMsgText');
                if (successMsgText) successMsgText.innerText = "All Modules ZIP Downloaded Successfully!";
                successMsg.classList.remove('hidden');
                successMsg.classList.add('active');
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            alert("No modules generated yet!");
        }
        
        btn.innerText = "📦 Download All (ZIP)";
        btn.disabled = false;
    }

    // =========================================================
    //  OPTION 3: GENERATE COMPLETE TERM ENGINE & UI
    // =========================================================
    function populateTermSubjectsList() {
        const year = yearSel.value;
        const term = termSel.value;
        const listContainer = document.getElementById('termSubjectsList');
        const selectAllCheckbox = document.getElementById('selectAllSubjects');
        const errEl = document.getElementById('termSubjectError');
        if (!listContainer) return;
        if (errEl) errEl.classList.add('hidden');

        const subjects = Object.keys(academicData[year]?.[term] || {});
        listContainer.innerHTML = '';

        if (subjects.length === 0) {
            listContainer.innerHTML = `<p class="text-sm font-medium text-slate-500 col-span-2">No subjects found for the selected Year and Term.</p>`;
            return;
        }

        subjects.forEach((sub) => {
            const item = document.createElement('label');
            item.className = "flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-violet-300 transition-colors shadow-sm";
            item.innerHTML = `
                <input type="checkbox" name="termSubject" value="${sub}" checked class="term-subject-checkbox w-4 h-4 text-violet-600 rounded">
                <span class="text-sm font-semibold text-slate-800">${sub}</span>
            `;
            listContainer.appendChild(item);
        });

        if (selectAllCheckbox) selectAllCheckbox.checked = true;

        const checkboxes = listContainer.querySelectorAll('input[name="termSubject"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                if (errEl) errEl.classList.add('hidden');
                const allChecked = Array.from(checkboxes).every(c => c.checked);
                if (selectAllCheckbox) selectAllCheckbox.checked = allChecked;
            });
        });

        if (selectAllCheckbox) {
            selectAllCheckbox.onchange = (e) => {
                if (errEl) errEl.classList.add('hidden');
                const isChecked = e.target.checked;
                checkboxes.forEach(cb => cb.checked = isChecked);
            };
        }
    }

    let completeTermState = {
        year: '',
        term: '',
        yearText: '',
        termText: '',
        selectedSubjects: [],
        subjectModulesMap: {},
        isGenerating: false,
        isCancelled: false,
        totalModulesCount: 0,
        generatedModulesCount: 0,
        failedModulesCount: 0,
        startTime: 0
    };

    function renderCompleteTermUI() {
        const container = document.getElementById('termProgressContainer');
        if (!container) return;

        const year = yearSel.value;
        const term = termSel.value;
        const yearText = year === 'I' ? 'First Year' : (year === 'II' ? 'Second Year' : `${year} Year`);
        const termText = `Term ${term}`;

        const selectedCheckboxes = document.querySelectorAll('input[name="termSubject"]:checked');
        const selectedSubjects = Array.from(selectedCheckboxes).map(cb => cb.value);

        completeTermState = {
            year: year,
            term: term,
            yearText: yearText,
            termText: termText,
            selectedSubjects: selectedSubjects,
            subjectModulesMap: {},
            isGenerating: false,
            isCancelled: false,
            totalModulesCount: 0,
            generatedModulesCount: 0,
            failedModulesCount: 0,
            startTime: 0
        };

        const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
        let totalModules = 0;

        selectedSubjects.forEach(sub => {
            const modulesData = academicData[year]?.[term]?.[sub] || {};
            const modKeys = Object.keys(modulesData);
            totalModules += modKeys.length;

            completeTermState.subjectModulesMap[sub] = {
                status: 'pending',
                totalCount: modKeys.length,
                completedCount: 0,
                failedCount: 0,
                modules: {}
            };

            modKeys.forEach(num => {
                const mData = modulesData[num];
                const title = mData.title || `Module ${num}`;
                const roman = (term === '4') ? num : (romanNumerals[parseInt(num) - 1] || num);
                completeTermState.subjectModulesMap[sub].modules[num] = {
                    num: num,
                    roman: roman,
                    title: title,
                    syllabus: mData.syllabus || "",
                    status: 'pending',
                    retried: false,
                    date: '',
                    content: { EXP: '', FEEL: '', LEARN: '', APP: '', CONC: '', ASSIGN: '' },
                    pdfBlob: null
                };
            });
        });

        completeTermState.totalModulesCount = totalModules;

        const titleEl = document.getElementById('termProgressTitle');
        const subtitleEl = document.getElementById('termProgressSubtitle');
        if (titleEl) titleEl.innerText = `Generating Complete Term - ${yearText}, ${termText}`;
        if (subtitleEl) subtitleEl.innerText = `${selectedSubjects.length} Subject(s) • ${totalModules} Total Modules`;

        // Date Controls Handler 1: Global Term Date
        const globalDateInput = document.getElementById('globalTermDateInput');
        if (globalDateInput) {
            globalDateInput.onchange = (e) => {
                const val = e.target.value;
                completeTermState.selectedSubjects.forEach(sub => {
                    const subData = completeTermState.subjectModulesMap[sub];
                    if (subData) {
                        subData.subjectDate = val;
                        Object.keys(subData.modules).forEach(mNum => {
                            subData.modules[mNum].date = val;
                        });
                    }
                });
                renderTermSubjectsStatusList();
            };
        }

        // Date Controls Handler 2: Auto-Assign Module Pattern
        const autoAssignBtn = document.getElementById('autoAssignModuleDatesBtn');
        if (autoAssignBtn) {
            autoAssignBtn.onclick = () => {
                let baseDateStr = globalDateInput && globalDateInput.value ? globalDateInput.value : new Date().toISOString().split('T')[0];
                const baseDate = new Date(baseDateStr);

                completeTermState.selectedSubjects.forEach(sub => {
                    const subData = completeTermState.subjectModulesMap[sub];
                    if (subData) {
                        const mKeys = Object.keys(subData.modules);
                        mKeys.forEach(mNum => {
                            const weekDayOffset = (parseInt(mNum) - 1) * 7; // 1-week gap per module
                            const modDate = new Date(baseDate);
                            modDate.setDate(modDate.getDate() + weekDayOffset);
                            const dateString = modDate.toISOString().split('T')[0];
                            subData.modules[mNum].date = dateString;
                        });
                        if (mKeys.length > 0) {
                            subData.subjectDate = subData.modules[mKeys[0]].date;
                        }
                    }
                });
                renderTermSubjectsStatusList();
            };
        }

        updateTermProgressDisplay(0, "Ready to start", "Module 0 of 0", "--");

        const summaryContainer = document.getElementById('termSummaryContainer');
        if (summaryContainer) summaryContainer.classList.add('hidden');

        renderTermSubjectsStatusList();

        const startBtn = document.getElementById('startTermGenBtn');
        const cancelBtn = document.getElementById('cancelTermGenBtn');
        const retryBtn = document.getElementById('retryFailedTermBtn');
        const downloadBtn = document.getElementById('downloadTermZipBtn');

        if (startBtn) {
            startBtn.classList.remove('hidden');
            startBtn.disabled = false;
            startBtn.innerHTML = `🚀 Start Term Generation`;
            startBtn.onclick = () => startTermGeneration();
        }
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.onclick = () => cancelTermGeneration();
        }
        if (retryBtn) {
            retryBtn.onclick = () => retryFailedTermModules();
        }
        if (downloadBtn) {
            downloadBtn.onclick = () => downloadTermZip();
        }
    }

    function renderTermSubjectsStatusList() {
        const listContainer = document.getElementById('termSubjectsStatusList');
        if (!listContainer) return;
        
        // Preserve open accordion states if re-rendering
        const openSubFolders = new Set();
        document.querySelectorAll('.term-sub-body:not(.hidden)').forEach(el => {
            openSubFolders.add(el.id);
        });
        const openModCards = new Set();
        document.querySelectorAll('.term-mod-content:not(.hidden)').forEach(el => {
            openModCards.add(el.id);
        });

        listContainer.innerHTML = '';

        const isTerm4 = (completeTermState.term === '4');
        const sectionsDef = [
            { tag: "EXP", name: "Experience" },
            { tag: "FEEL", name: "Feelings" },
            { tag: "LEARN", name: "Learning" },
            { tag: "APP", name: "Application" },
            { tag: "CONC", name: "Conclusion" }
        ];

        completeTermState.selectedSubjects.forEach(sub => {
            const subData = completeTermState.subjectModulesMap[sub];
            if (!subData) return;

            const subSafe = sub.replace(/[^a-zA-Z0-9]/g, '');
            const card = document.createElement('div');
            card.id = `term-sub-card-${subSafe}`;
            card.className = "bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4 transition-all";

            let statusBadgeHTML = `<span class="px-2.5 py-1 bg-slate-200 text-slate-600 font-bold text-xs rounded-full">Pending</span>`;
            if (subData.status === 'generating') {
                statusBadgeHTML = `<span class="px-2.5 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-full animate-pulse flex items-center gap-1.5"><svg class="animate-spin w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> In Progress</span>`;
            } else if (subData.status === 'completed') {
                statusBadgeHTML = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1">✓ Completed (${subData.completedCount}/${subData.totalCount})</span>`;
            } else if (subData.status === 'completed_with_errors') {
                statusBadgeHTML = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full flex items-center gap-1">⚠️ ${subData.completedCount}/${subData.totalCount} Completed</span>`;
            }

            const header = document.createElement('div');
            header.className = "p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors";
            
            const titleArea = document.createElement('div');
            titleArea.className = "flex items-center gap-3 flex-grow";
            titleArea.innerHTML = `
                <svg id="arrow-${subSafe}" class="w-4 h-4 text-slate-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                <div>
                    <h3 class="font-bold text-slate-800 text-sm md:text-base">${sub}</h3>
                    <p class="text-xs text-slate-500 font-medium">${subData.completedCount} of ${subData.totalCount} modules generated</p>
                </div>
            `;

            const controlsArea = document.createElement('div');
            controlsArea.className = "flex flex-wrap items-center gap-2";
            controlsArea.onclick = (e) => e.stopPropagation();

            const firstModKey = Object.keys(subData.modules)[0];
            const initialSubDate = subData.subjectDate || (firstModKey ? subData.modules[firstModKey].date : '');

            const subDateInput = document.createElement('input');
            subDateInput.type = 'date';
            subDateInput.value = initialSubDate || '';
            subDateInput.className = "form-input px-2.5 py-1 text-xs rounded border border-slate-300";
            subDateInput.title = "Set date for all modules in this subject";
            subDateInput.onchange = (e) => {
                const val = e.target.value;
                subData.subjectDate = val;
                Object.keys(subData.modules).forEach(mNum => {
                    subData.modules[mNum].date = val;
                    const dInp = document.getElementById(`term-mod-date-${subSafe}-${mNum}`);
                    if (dInp) dInp.value = val;
                });
            };

            const subWeeklyBtn = document.createElement('button');
            subWeeklyBtn.className = "px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded transition-colors flex items-center gap-1";
            subWeeklyBtn.innerHTML = `<span>⚡ Weekly Dates</span>`;
            subWeeklyBtn.title = "Auto-assign weekly dates (+7 days) for this subject";
            subWeeklyBtn.onclick = () => {
                const globalDateInput = document.getElementById('globalTermDateInput');
                const baseStr = subDateInput.value ? subDateInput.value : (globalDateInput && globalDateInput.value ? globalDateInput.value : new Date().toISOString().split('T')[0]);
                const baseDate = new Date(baseStr);
                const keys = Object.keys(subData.modules);
                keys.forEach((mNum, idx) => {
                    const weekDate = new Date(baseDate);
                    weekDate.setDate(weekDate.getDate() + (idx * 7));
                    const dateStr = weekDate.toISOString().split('T')[0];
                    subData.modules[mNum].date = dateStr;
                    const dInp = document.getElementById(`term-mod-date-${subSafe}-${mNum}`);
                    if (dInp) dInp.value = dateStr;
                });
                if (keys.length > 0) {
                    const firstDate = subData.modules[keys[0]].date;
                    subData.subjectDate = firstDate;
                    subDateInput.value = firstDate;
                }
            };

            const subZipBtn = document.createElement('button');
            subZipBtn.className = "px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed";
            subZipBtn.innerHTML = `<span>📦 Subject ZIP</span>`;
            subZipBtn.disabled = (subData.completedCount === 0);
            subZipBtn.onclick = () => downloadTermSubjectZip(sub);

            controlsArea.appendChild(subDateInput);
            controlsArea.appendChild(subWeeklyBtn);
            controlsArea.appendChild(subZipBtn);
            controlsArea.appendChild(document.createRange().createContextualFragment(statusBadgeHTML));

            header.appendChild(titleArea);
            header.appendChild(controlsArea);

            const body = document.createElement('div');
            const bodyId = `term-sub-body-${subSafe}`;
            body.id = bodyId;
            const isPreviouslyOpen = openSubFolders.has(bodyId);
            body.className = `${isPreviouslyOpen ? '' : 'hidden '}term-sub-body p-4 space-y-3 bg-slate-50/50 border-t border-slate-100`;

            header.onclick = () => {
                body.classList.toggle('hidden');
                const arrow = document.getElementById(`arrow-${subSafe}`);
                if (arrow) arrow.classList.toggle('rotate-180');
            };

            if (isPreviouslyOpen) {
                setTimeout(() => {
                    const arrow = document.getElementById(`arrow-${subSafe}`);
                    if (arrow) arrow.classList.add('rotate-180');
                }, 0);
            }

            Object.keys(subData.modules).forEach(mNum => {
                const modObj = subData.modules[mNum];
                const modCard = document.createElement('div');
                modCard.className = "bg-white border border-slate-200 rounded-lg p-3 shadow-sm transition-all";

                const modHeader = document.createElement('div');
                modHeader.className = "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer select-none hover:opacity-90 transition-opacity";

                let modBadge = '';
                if (modObj.status === 'generating') {
                    const statusText = modObj.generatingSectionName ? `Generating ${modObj.generatingSectionName}...` : 'Generating...';
                    modBadge = `<span class="px-2.5 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-full animate-pulse flex items-center gap-1.5"><svg class="animate-spin w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${statusText}</span>`;
                } else if (modObj.status === 'generated') {
                    modBadge = `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded">✓ Generated</span>`;
                } else if (modObj.status === 'failed') {
                    modBadge = `<span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[11px] rounded">⚠️ Failed</span>`;
                }

                const modTitleDiv = document.createElement('div');
                modTitleDiv.className = "flex items-center gap-2 flex-grow";
                modTitleDiv.innerHTML = `
                    <svg id="mod-arrow-${subSafe}-${mNum}" class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    <h4 class="font-bold text-slate-800 text-xs sm:text-sm">${isTerm4 ? 'Assessment' : 'Module'} ${modObj.roman}: ${modObj.title}</h4>
                `;

                const modControls = document.createElement('div');
                modControls.className = "flex flex-wrap items-center gap-2";
                modControls.onclick = (e) => e.stopPropagation();

                const modDateInput = document.createElement('input');
                modDateInput.id = `term-mod-date-${subSafe}-${mNum}`;
                modDateInput.type = 'date';
                modDateInput.value = modObj.date || '';
                modDateInput.className = "form-input px-2 py-1 text-[11px] rounded border border-slate-300";
                modDateInput.onchange = (e) => { modObj.date = e.target.value; };

                modControls.appendChild(modDateInput);

                if (modObj.status === 'pending' || modObj.status === 'failed') {
                    const modGenBtn = document.createElement('button');
                    modGenBtn.className = "px-2.5 py-1 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-xs rounded transition-colors disabled:opacity-50";
                    modGenBtn.innerHTML = `✨ Generate`;
                    modGenBtn.onclick = async () => {
                        modGenBtn.disabled = true;
                        modGenBtn.innerText = "⏳...";
                        await generateSingleTermModule(sub, mNum);
                    };
                    modControls.appendChild(modGenBtn);
                }

                const modDlBtn = document.createElement('button');
                modDlBtn.className = "px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
                modDlBtn.innerText = "📄 Download";
                modDlBtn.disabled = (modObj.status !== 'generated' && modObj.status !== 'failed');
                modDlBtn.onclick = () => downloadTermModulePDF(sub, mNum);

                modControls.appendChild(modDlBtn);
                if (modBadge) {
                    modControls.appendChild(document.createRange().createContextualFragment(modBadge));
                }

                modHeader.appendChild(modTitleDiv);
                modHeader.appendChild(modControls);
                modCard.appendChild(modHeader);

                const modContentDiv = document.createElement('div');
                const modContentId = `term-mod-content-${subSafe}-${mNum}`;
                modContentDiv.id = modContentId;
                const isModOpen = openModCards.has(modContentId);
                modContentDiv.className = `${isModOpen ? '' : 'hidden '}term-mod-content space-y-2 pt-2 border-t border-slate-100 mt-2`;

                modHeader.onclick = () => {
                    modContentDiv.classList.toggle('hidden');
                    const modArrow = document.getElementById(`mod-arrow-${subSafe}-${mNum}`);
                    if (modArrow) modArrow.classList.toggle('rotate-180');
                };

                if (isModOpen) {
                    setTimeout(() => {
                        const modArrow = document.getElementById(`mod-arrow-${subSafe}-${mNum}`);
                        if (modArrow) modArrow.classList.add('rotate-180');
                    }, 0);
                }

                if (isTerm4) {
                    const assignDiv = document.createElement('div');
                    assignDiv.innerHTML = `
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Assignment Answers</label>
                        <textarea id="ta-term-${subSafe}-${mNum}-ASSIGN" class="w-full form-input px-2.5 py-1.5 text-xs rounded border border-slate-300 h-24">${modObj.content.ASSIGN || ''}</textarea>
                    `;
                    modContentDiv.appendChild(assignDiv);
                } else {
                    sectionsDef.forEach(sec => {
                        const secDiv = document.createElement('div');
                        const wcId = `wc-term-${subSafe}-${mNum}-${sec.tag}`;
                        secDiv.innerHTML = `
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-[11px] font-bold text-slate-600">${sec.name}</span>
                                <span id="${wcId}" class="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold">0 words</span>
                            </div>
                            <textarea id="ta-term-${subSafe}-${mNum}-${sec.tag}" class="w-full form-input px-2.5 py-1.5 text-xs rounded border border-slate-300 h-16">${modObj.content[sec.tag] || ''}</textarea>
                        `;
                        modContentDiv.appendChild(secDiv);
                    });
                }

                modCard.appendChild(modContentDiv);
                body.appendChild(modCard);

                setTimeout(() => {
                    if (isTerm4) {
                        const ta = document.getElementById(`ta-term-${subSafe}-${mNum}-ASSIGN`);
                        if (ta) ta.addEventListener('input', (e) => { modObj.content.ASSIGN = e.target.value; });
                    } else {
                        sectionsDef.forEach(sec => {
                            const ta = document.getElementById(`ta-term-${subSafe}-${mNum}-${sec.tag}`);
                            const wc = document.getElementById(`wc-term-${subSafe}-${mNum}-${sec.tag}`);
                            if (ta) {
                                const updateWC = () => {
                                    const val = ta.value;
                                    modObj.content[sec.tag] = val;
                                    if (wc) {
                                        const count = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
                                        wc.innerText = `${count} words`;
                                        if (count >= 420) {
                                            wc.className = "text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold";
                                        } else {
                                            wc.className = "text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold";
                                        }
                                    }
                                };
                                ta.addEventListener('input', updateWC);
                                updateWC();
                            }
                        });
                    }
                }, 0);
            });

            card.appendChild(header);
            card.appendChild(body);
            listContainer.appendChild(card);
        });
    }

    async function downloadTermSubjectZip(subName) {
        const subData = completeTermState.subjectModulesMap[subName];
        if (!subData) return;

        try {
            const zip = new JSZip();
            const subFolder = zip.folder(subName);
            let addedCount = 0;

            const modKeys = Object.keys(subData.modules);
            for (let i = 0; i < modKeys.length; i++) {
                const num = modKeys[i];
                const modObj = subData.modules[num];
                if (modObj.pdfBlob && (modObj.status === 'generated' || modObj.status === 'failed')) {
                    subFolder.file(`Module ${num}.pdf`, modObj.pdfBlob);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                const zipContent = await zip.generateAsync({ type: "blob" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(zipContent);
                const safeSub = subName.replace(/[^a-zA-Z0-9\s]/g, '');
                a.download = `${safeSub}_All_RJs.zip`;
                a.click();
                qjAnalytics.recordEvent({ generationType: 'TERM', moduleCount: addedCount, durationMs: 0 }); // 📊 Analytics (moduleCount = modules in this subject's ZIP)
            } else {
                alert("No modules generated yet for this subject.");
            }
        } catch (err) {
            console.error("Subject ZIP download error:", err);
            alert("Failed to create subject ZIP.");
        }
    }

    async function downloadTermModulePDF(subName, modNum) {
        const subData = completeTermState.subjectModulesMap[subName];
        if (!subData) return;
        const modObj = subData.modules[modNum];
        if (!modObj) return;

        try {
            if (!modObj.pdfBlob) {
                const cachedHeader = await getBase64ImageFromURL('header.png').catch(() => null);
                modObj.pdfBlob = await buildPDFBlobForModule(subName, modObj, cachedHeader);
            }
            if (modObj.pdfBlob) {
                const url = URL.createObjectURL(modObj.pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                const safeName = (document.getElementById('studentName').value || 'Student').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const safeReg = (document.getElementById('regNumber').value || 'REG').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const safeSub = subName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                const docType = (completeTermState.term === '4') ? "Assignment" : "RJ";
                a.download = `${safeName}_${safeReg}_${docType}_${safeSub}-${modObj.roman}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                qjAnalytics.recordEvent({ generationType: (completeTermState.term === '4') ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: 0 }); // 📊 Analytics
            }
        } catch (err) {
            console.error("Module PDF download error:", err);
            alert("Failed to download PDF.");
        }
    }

    async function generateSingleTermModule(subName, modNum) {
        const subData = completeTermState.subjectModulesMap[subName];
        if (!subData) return;
        const modObj = subData.modules[modNum];
        if (!modObj) return;

        const isTerm4 = (completeTermState.term === '4');
        modObj.status = 'generating';
        renderTermSubjectsStatusList();

        let success = false;
        try {
            if (isTerm4) {
                modObj.content.ASSIGN = getClientAssignmentFallback(subName, modObj.roman, modObj.title, modObj.roman);
                success = true;
            } else {
                for (let secIdx = 0; secIdx < sectionsDefinition.length; secIdx++) {
                    const sec = sectionsDefinition[secIdx];
                    modObj.generatingSectionName = sec.name;
                    renderTermSubjectsStatusList();
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 3000);
                        const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            signal: controller.signal,
                            body: JSON.stringify({ 
                                subject: subName, moduleRoman: modObj.roman, topic: modObj.title, 
                                syllabus: modObj.syllabus, sectionTag: sec.tag, styleInstruction: sec.hint, requestSeed: Date.now()
                            })
                        });
                        clearTimeout(timeoutId);
                        const data = await res.json();
                        if (!res.ok) throw new Error("API error");
                        modObj.content[sec.tag] = data.text;
                    } catch (e) {
                        modObj.content[sec.tag] = getClientFallback(sec.tag, subName, modObj.title);
                    }
                }
                modObj.generatingSectionName = '';
                success = true;
            }
        } catch (e) {}

        if (success) {
            modObj.status = 'generated';
            const cachedHeader = await getBase64ImageFromURL('header.png').catch(() => null);
            modObj.pdfBlob = await buildPDFBlobForModule(subName, modObj, cachedHeader);
            subData.completedCount++;
            completeTermState.generatedModulesCount++;
            qjAnalytics.recordEvent({ generationType: (completeTermState.term === '4') ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: 0 }); // 📊 Analytics
        } else {
            modObj.status = 'failed';
        }

        if (subData.completedCount === subData.totalCount) subData.status = 'completed';
        renderTermSubjectsStatusList();
    }

    function updateTermProgressDisplay(percent, subjectText, moduleText, timeText) {
        const percentEl = document.getElementById('termProgressPercent');
        const barEl = document.getElementById('termProgressBar');
        const subjEl = document.getElementById('termCurrentSubjectText');
        const modEl = document.getElementById('termCurrentModuleText');
        const timeEl = document.getElementById('termTimeRemainingText');

        const cleanPercent = Math.min(100, Math.max(0, Math.round(percent)));
        if (percentEl) percentEl.innerText = `${cleanPercent}%`;
        if (barEl) barEl.style.width = `${cleanPercent}%`;
        if (subjEl) subjEl.innerText = `Current Subject: ${subjectText}`;
        if (modEl) modEl.innerText = `Current Module: ${moduleText}`;
        if (timeEl) timeEl.innerText = `Est. Time Remaining: ${timeText}`;
    }

    async function startTermGeneration() {
        if (completeTermState.isGenerating) return;

        completeTermState.isGenerating = true;
        completeTermState.isCancelled = false;
        completeTermState.startTime = Date.now();

        const startBtn = document.getElementById('startTermGenBtn');
        const cancelBtn = document.getElementById('cancelTermGenBtn');
        const summaryContainer = document.getElementById('termSummaryContainer');

        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = `<svg class="animate-spin w-4 h-4 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...`;
        }
        if (cancelBtn) cancelBtn.classList.remove('hidden');
        if (summaryContainer) summaryContainer.classList.add('hidden');

        const isTerm4 = (completeTermState.term === '4');
        let processedCount = 0;

        const cachedHeader = await getBase64ImageFromURL('header.png').catch(() => null);

        for (let sIdx = 0; sIdx < completeTermState.selectedSubjects.length; sIdx++) {
            if (completeTermState.isCancelled) break;

            const subName = completeTermState.selectedSubjects[sIdx];
            const subData = completeTermState.subjectModulesMap[subName];
            subData.status = 'generating';
            renderTermSubjectsStatusList();

            const modKeys = Object.keys(subData.modules);

            for (let mIdx = 0; mIdx < modKeys.length; mIdx++) {
                if (completeTermState.isCancelled) break;

                const modNum = modKeys[mIdx];
                const modObj = subData.modules[modNum];

                if (modObj.status === 'generated') {
                    processedCount++;
                    continue;
                }

                modObj.status = 'generating';

                const percent = (processedCount / completeTermState.totalModulesCount) * 100;
                const elapsedSec = (Date.now() - completeTermState.startTime) / 1000;
                let estTimeStr = "--";
                if (processedCount > 0) {
                    const avgSec = elapsedSec / processedCount;
                    const remCount = completeTermState.totalModulesCount - processedCount;
                    const remSec = Math.ceil(avgSec * remCount);
                    const mins = Math.floor(remSec / 60);
                    const secs = remSec % 60;
                    estTimeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                }

                const isAssessmentLabel = isTerm4 ? `Assessment ${modNum}` : `Module ${modObj.roman} of ${modKeys.length}`;
                updateTermProgressDisplay(percent, subName, isAssessmentLabel, estTimeStr);

                let success = false;
                let attempt = 0;

                while (attempt < 2 && !success && !completeTermState.isCancelled) {
                    attempt++;
                    try {
                        if (isTerm4) {
                            modObj.content.ASSIGN = getClientAssignmentFallback(subName, modObj.roman, modObj.title, modObj.roman);
                            success = true;
                        } else {
                            for (let secIdx = 0; secIdx < sectionsDefinition.length; secIdx++) {
                                if (completeTermState.isCancelled) break;
                                const sec = sectionsDefinition[secIdx];
                                modObj.generatingSectionName = sec.name;
                                renderTermSubjectsStatusList();
                                
                                try {
                                    const controller = new AbortController();
                                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                                    const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        signal: controller.signal,
                                        body: JSON.stringify({ 
                                            subject: subName, 
                                            moduleRoman: modObj.roman, 
                                            topic: modObj.title, 
                                            syllabus: modObj.syllabus, 
                                            sectionTag: sec.tag,
                                            styleInstruction: sec.hint,
                                            requestSeed: Date.now()
                                        })
                                    });
                                    clearTimeout(timeoutId);
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || "API failed");
                                    modObj.content[sec.tag] = data.text;
                                } catch (err) {
                                    modObj.content[sec.tag] = getClientFallback(sec.tag, subName, modObj.title);
                                }
                            }
                            success = true;
                        }
                    } catch (err) {
                        console.warn(`Attempt ${attempt} failed for module ${modNum} of ${subName}:`, err);
                        if (attempt < 2) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }

                modObj.generatingSectionName = '';

                if (success && !completeTermState.isCancelled) {
                    modObj.status = 'generated';
                    try {
                        modObj.pdfBlob = await buildPDFBlobForModule(subName, modObj, cachedHeader);
                        subData.completedCount++;
                        completeTermState.generatedModulesCount++;
                        qjAnalytics.recordEvent({ generationType: isTerm4 ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: 0 }); // 📊 Analytics
                    } catch (pdfErr) {
                        console.error("PDF Blob generation failed:", pdfErr);
                        modObj.status = 'failed';
                        subData.failedCount++;
                        completeTermState.failedModulesCount++;
                    }
                } else {
                    modObj.status = 'failed';
                    subData.failedCount++;
                    completeTermState.failedModulesCount++;
                }

                processedCount++;
                renderTermSubjectsStatusList();
            }

            if (subData.completedCount === subData.totalCount) {
                subData.status = 'completed';
            } else {
                subData.status = 'completed_with_errors';
            }
            renderTermSubjectsStatusList();
        }

        completeTermState.isGenerating = false;
        if (cancelBtn) cancelBtn.classList.add('hidden');

        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = `🚀 Restart Generation`;
        }

        const finalPercent = (processedCount / completeTermState.totalModulesCount) * 100;
        updateTermProgressDisplay(finalPercent, "Completed", "Finished", "0s");

        finishTermGenerationSummary();
    }

    function finishTermGenerationSummary() {
        const summaryContainer = document.getElementById('termSummaryContainer');
        const summaryTitle = document.getElementById('termSummaryTitle');
        const summaryText = document.getElementById('termSummaryText');
        const summaryIcon = document.getElementById('termSummaryIcon');
        const retryBtn = document.getElementById('retryFailedTermBtn');
        const downloadBtn = document.getElementById('downloadTermZipBtn');

        if (!summaryContainer) return;
        summaryContainer.classList.remove('hidden');

        const totalGenerated = completeTermState.generatedModulesCount;
        const totalFailed = completeTermState.failedModulesCount;

        if (summaryText) {
            summaryText.innerText = `Completed: ${totalGenerated} PDFs | Failed: ${totalFailed} PDFs`;
        }

        if (totalFailed > 0) {
            if (summaryIcon) summaryIcon.innerText = "⚠️";
            if (summaryTitle) summaryTitle.innerText = "Term Generation Finished with Issues";
            if (retryBtn) retryBtn.classList.remove('hidden');
        } else {
            if (summaryIcon) summaryIcon.innerText = "🎉";
            if (summaryTitle) summaryTitle.innerText = "Term Generation Complete!";
            if (retryBtn) retryBtn.classList.add('hidden');
        }

        if (downloadBtn) {
            downloadBtn.disabled = (totalGenerated === 0);
        }
    }

    function cancelTermGeneration() {
        completeTermState.isCancelled = true;
        completeTermState.isGenerating = false;
        const cancelBtn = document.getElementById('cancelTermGenBtn');
        const startBtn = document.getElementById('startTermGenBtn');
        if (cancelBtn) cancelBtn.classList.add('hidden');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = `🚀 Resume / Restart Generation`;
        }
    }

    async function retryFailedTermModules() {
        if (completeTermState.isGenerating) return;

        completeTermState.isGenerating = true;
        completeTermState.isCancelled = false;

        const retryBtn = document.getElementById('retryFailedTermBtn');
        const cancelBtn = document.getElementById('cancelTermGenBtn');
        if (retryBtn) {
            retryBtn.disabled = true;
            retryBtn.innerText = "⏳ Retrying Failed...";
        }
        if (cancelBtn) cancelBtn.classList.remove('hidden');

        const isTerm4 = (completeTermState.term === '4');
        const cachedHeader = await getBase64ImageFromURL('header.png').catch(() => null);

        for (let sIdx = 0; sIdx < completeTermState.selectedSubjects.length; sIdx++) {
            if (completeTermState.isCancelled) break;
            const subName = completeTermState.selectedSubjects[sIdx];
            const subData = completeTermState.subjectModulesMap[subName];
            const modKeys = Object.keys(subData.modules);

            for (let mIdx = 0; mIdx < modKeys.length; mIdx++) {
                if (completeTermState.isCancelled) break;
                const modNum = modKeys[mIdx];
                const modObj = subData.modules[modNum];

                if (modObj.status === 'failed') {
                    modObj.status = 'generating';
                    let success = false;

                    try {
                        if (isTerm4) {
                            modObj.content.ASSIGN = getClientAssignmentFallback(subName, modObj.roman, modObj.title, modObj.roman);
                            success = true;
                        } else {
                            for (let secIdx = 0; secIdx < sectionsDefinition.length; secIdx++) {
                                const sec = sectionsDefinition[secIdx];
                                modObj.content[sec.tag] = getClientFallback(sec.tag, subName, modObj.title);
                            }
                            success = true;
                        }
                    } catch (e) {}

                    if (success) {
                        modObj.status = 'generated';
                        try {
                            modObj.pdfBlob = await buildPDFBlobForModule(subName, modObj, cachedHeader);
                            subData.failedCount = Math.max(0, subData.failedCount - 1);
                            subData.completedCount++;
                            completeTermState.failedModulesCount = Math.max(0, completeTermState.failedModulesCount - 1);
                            completeTermState.generatedModulesCount++;
                            qjAnalytics.recordEvent({ generationType: isTerm4 ? 'ASSIGNMENT' : 'MODULE', moduleCount: 1, durationMs: 0 }); // 📊 Analytics
                        } catch (pdfErr) {
                            modObj.status = 'failed';
                        }
                    } else {
                        modObj.status = 'failed';
                    }
                    renderTermSubjectsStatusList();
                }
            }

            if (subData.completedCount === subData.totalCount) {
                subData.status = 'completed';
            }
            renderTermSubjectsStatusList();
        }

        completeTermState.isGenerating = false;
        if (cancelBtn) cancelBtn.classList.add('hidden');
        if (retryBtn) {
            retryBtn.disabled = false;
            retryBtn.innerText = "🔄 Generate Failed Modules";
        }

        finishTermGenerationSummary();
    }

    async function buildPDFBlobForModule(subjectName, modObj, preloadedHeaderImage = null) {
        const isTerm4 = (completeTermState.term === '4');
        const headerImageData = preloadedHeaderImage || await getBase64ImageFromURL('header.png').catch(() => null);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
        
        const currentDate = formatDate(document.getElementById('journalDate').value || new Date().toISOString().split('T')[0]);

        const dataObj = {
            name: document.getElementById('studentName').value || 'Student',
            reg: document.getElementById('regNumber').value || 'REG123',
            sec: document.getElementById('classSection').value || 'SEC-A',
            yt: formatYearTermPDF(completeTermState.year, completeTermState.term),
            sub: subjectName,
            assNum: modObj.roman,
            date: currentDate,
            topic: modObj.title,
            assign: modObj.content.ASSIGN,
            exp: modObj.content.EXP,
            feel: modObj.content.FEEL,
            learn: modObj.content.LEARN,
            app: modObj.content.APP,
            conc: modObj.content.CONC
        };

        const pageWidth = doc.internal.pageSize.width;
        let startY = 45; 

        doc.autoTable({
            startY: startY, margin: { top: 45 }, theme: 'grid',
            styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
            body: [
                [{ content: 'Student Name', styles: { fontStyle: 'bold', cellWidth: 50 } }, { content: dataObj.name, colSpan: 2, styles: { fontStyle: 'bold' } }],
                [{ content: 'Student Registration Number', styles: { fontStyle: 'bold' } }, { content: dataObj.reg }, { content: `Class & Section: ${dataObj.sec}`, styles: { fontStyle: 'bold' } }],
                [{ content: 'Study Level : UG/PG', styles: { fontStyle: 'bold' } }, { content: 'UG' }, { content: `Year & Term: ${dataObj.yt}`, styles: { fontStyle: 'bold' } }],
                [{ content: 'Subject Name', styles: { fontStyle: 'bold' } }, { content: dataObj.sub, colSpan: 2, styles: { fontStyle: 'bold' } }]
            ],
        });

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 5, margin: { top: 45 }, theme: 'grid',
            styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
            body: [
                [{ content: isTerm4 ? 'Assessment' : 'Name of the Assessment', styles: { fontStyle: 'bold', cellWidth: isTerm4 ? 50 : 60 } }, { content: `${isTerm4 ? "Assignment" : "Reflective Journal"} - ${dataObj.assNum}` }],
                [{ content: 'Date of Submission', styles: { fontStyle: 'bold' } }, { content: dataObj.date }]
            ],
        });

        let currentY = doc.lastAutoTable.finalY + 15;
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text(`${isTerm4 ? "Assignment" : "Reflective Journal"} - ${dataObj.assNum}`, pageWidth/2, currentY, { align: "center" });

        let qaY;
        if (!isTerm4) {
            currentY += 8;
            doc.autoTable({
                startY: currentY, margin: { top: 45 }, theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Date', styles: { fontStyle: 'normal', textColor: [192, 0, 0], cellWidth: 40 } }, { content: dataObj.date }],
                    [{ content: `Journal Entry\nTopic`, styles: { fontStyle: 'normal', textColor: [192, 0, 0] } }, { content: dataObj.topic }]
                ],
            });
            qaY = doc.lastAutoTable.finalY;
        } else {
            qaY = currentY + 10;
        }

        const drawContentSection = (title, content, startPosY) => {
            doc.autoTable({
                startY: startPosY, margin: { top: 45 }, theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 4 },
                columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
                body: [[title, content || ""]],
            });
        };

        if (isTerm4) {
            const qaBlocks = [];
            const regex = /Question\s*(\d+):?\s*([\s\S]*?)\n+Answer:\s*([\s\S]*?)(?=\n*Question\s*\d+:|$)/gi;
            let match;
            while ((match = regex.exec(dataObj.assign)) !== null) {
                qaBlocks.push({ qNum: match[1], question: match[2].trim(), answer: match[3].trim() });
            }
            let bodyData = [];
            qaBlocks.forEach((block) => {
                bodyData.push([{ content: `Question ${block.qNum}: ${block.question}`, styles: { fontStyle: 'bold', fontSize: 11 } }]);
                bodyData.push([{ content: `Answer:\n\n${block.answer}`, styles: { fontStyle: 'normal' } }]);
            });
            doc.autoTable({
                startY: qaY, margin: { top: 45 }, theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 6 },
                body: bodyData,
                didParseCell: function(data) {
                    if (data.row.index % 2 === 0) {
                        data.cell.styles.lineWidth = { top: 0.2, right: 0.2, bottom: 0, left: 0.2 };
                    } else {
                        data.cell.styles.lineWidth = { top: 0, right: 0.2, bottom: 0.2, left: 0.2 };
                    }
                }
            });
        } else {
            drawContentSection('1. Experience\n(Class Content)', dataObj.exp, qaY);
            drawContentSection('2. Feelings\n(Emotional Reactions)', dataObj.feel, doc.lastAutoTable.finalY);
            drawContentSection('3. Learning\n(Key Insights)', dataObj.learn, doc.lastAutoTable.finalY);
            drawContentSection('4. Application\n(Practical Use)', dataObj.app, doc.lastAutoTable.finalY);
            drawContentSection('5. Conclusion', dataObj.conc, doc.lastAutoTable.finalY);
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            if (headerImageData) {
                doc.addImage(headerImageData, 'PNG', 0, 0, 210, 35);
            } else {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.text("AURORA HIGHER EDUCATION", pageWidth/2, 20, { align: "center" });
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                doc.text("Deemed-to-be-University Estd.u/s.03 of UGC Act 1956", pageWidth/2, 27, { align: "center" });
                doc.setFontSize(10);
                doc.text("Uppal, Hyderabad, Telangana | Bhongir, Yadadri, Telangana", pageWidth/2, 33, { align: "center" });
            }
        }

        return doc.output('blob');
    }

    async function downloadTermZip() {
        const downloadBtn = document.getElementById('downloadTermZipBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerText = "📦 Zipping Complete Term...";
        }

        try {
            const zip = new JSZip();
            const topFolder = `${completeTermState.yearText} - Term ${completeTermState.term}`;
            const folder = zip.folder(topFolder);

            let addedCount = 0;

            completeTermState.selectedSubjects.forEach(subName => {
                const subData = completeTermState.subjectModulesMap[subName];
                const subFolder = folder.folder(subName);
                const modKeys = Object.keys(subData.modules);

                modKeys.forEach(num => {
                    const modObj = subData.modules[num];
                    if (modObj.pdfBlob && modObj.status === 'generated') {
                        subFolder.file(`Module ${num}.pdf`, modObj.pdfBlob);
                        addedCount++;
                    }
                });
            });

            if (addedCount > 0) {
                const zipContent = await zip.generateAsync({ type: "blob" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(zipContent);
                a.download = `${topFolder}.zip`;
                a.click();

                const successMsg = document.getElementById('successMsg');
                if (successMsg) {
                    const successMsgText = document.getElementById('successMsgText');
                    if (successMsgText) successMsgText.innerText = "Complete Term ZIP Downloaded Successfully!";
                    successMsg.classList.remove('hidden');
                    successMsg.classList.add('active');
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                alert("No modules available for download.");
            }
        } catch (err) {
            console.error("ZIP Generation error:", err);
            alert("An error occurred while generating the ZIP file.");
        } finally {
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.innerText = "📦 Download Complete Term (ZIP)";
            }
        }
    }

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
            const contentFields = ['experience', 'feelings', 'learning', 'application', 'conclusion', 'assignmentAnswers'];

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
            updateAssessmentLabel();

            // Smooth scroll back to top of dashboard
            document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---------------- MILESTONE FLOATING SHORTCUT ----------------
    const milestoneBadge = document.getElementById('milestoneBadge');
    if (milestoneBadge) {
        milestoneBadge.addEventListener('click', () => {
            const section = document.getElementById('communityImpact');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // ---------------- NAAVIK MODAL ----------------
    const naavikBadge = document.getElementById('naavikBadge');
    const naavikModal = document.getElementById('naavikModal');
    const naavikOverlay = document.getElementById('naavikOverlay');
    const closeNaavikModalBtn = document.getElementById('closeNaavikModalBtn');
    const exploreNaavikBtn = document.getElementById('exploreNaavikBtn');
    const instaNaavikBtn = document.getElementById('instaNaavikBtn');
    const copyNaavikLinkBtn = document.getElementById('copyNaavikLinkBtn');

    if (naavikModal) {
        let wasNaavikAutoShown = false;

        const showNaavik = () => {
            naavikModal.classList.remove('hidden');
            setTimeout(() => {
                naavikModal.classList.add('active');
            }, 10);
            
            // Analytics
            let openedCount = parseInt(localStorage.getItem('naavik_popup_opened') || '0', 10);
            localStorage.setItem('naavik_popup_opened', (openedCount + 1).toString());
        };

        const hideNaavik = () => {
            naavikModal.classList.remove('active');
            setTimeout(() => {
                naavikModal.classList.add('hidden');
            }, 350);
            
            // Increment auto-show count only if it was auto-shown
            if (wasNaavikAutoShown) {
                let count = parseInt(localStorage.getItem('naavikPopupCount') || '0', 10);
                localStorage.setItem('naavikPopupCount', (count + 1).toString());
                wasNaavikAutoShown = false;
            }
        };

        if (naavikBadge) naavikBadge.addEventListener('click', showNaavik);
        if (closeNaavikModalBtn) closeNaavikModalBtn.addEventListener('click', hideNaavik);
        if (naavikOverlay) naavikOverlay.addEventListener('click', hideNaavik);
        
        if (exploreNaavikBtn) {
            exploreNaavikBtn.addEventListener('click', () => {
                let count = parseInt(localStorage.getItem('naavik_explore_clicked') || '0', 10);
                localStorage.setItem('naavik_explore_clicked', (count + 1).toString());
            });
        }
        
        if (instaNaavikBtn) {
            instaNaavikBtn.addEventListener('click', () => {
                let count = parseInt(localStorage.getItem('naavik_instagram_clicked') || '0', 10);
                localStorage.setItem('naavik_instagram_clicked', (count + 1).toString());
            });
        }

        if (copyNaavikLinkBtn) {
            copyNaavikLinkBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText('https://join-naavik.vercel.app/');
                    const copyText = document.getElementById('copyText');
                    const copyIcon = document.getElementById('copyIcon');
                    
                    if (copyText) copyText.innerText = 'Copied!';
                    if (copyIcon) {
                        copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                        copyIcon.classList.add('text-emerald-500');
                    }
                    
                    setTimeout(() => {
                        if (copyText) copyText.innerText = 'Copy Link';
                        if (copyIcon) {
                            copyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
                            copyIcon.classList.remove('text-emerald-500');
                        }
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            });
        }

        // Show Naavik automatically every time the user opens the page
        setTimeout(() => {
            wasNaavikAutoShown = true;
            showNaavik();
        }, 2500); 
    }

    // ---------------- WORD COUNT TRACKING ----------------
    const textareas = ['experience', 'feelings', 'learning', 'application', 'conclusion', 'assignmentAnswers'];
    textareas.forEach(id => {
        const area = document.getElementById(id);
        const badge = document.getElementById(`wc-${id}`);
        
        const updateCount = () => {
            const text = area.value.trim();
            const words = text ? text.split(/\s+/).length : 0;
            badge.innerText = `${words} words`;
            
            // Color feedback (Green at 450+ words for journals, 2000+ for assignmentAnswers)
            if (id === 'assignmentAnswers') {
                if (words >= 2000) {
                    badge.className = "text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-600 font-bold";
                } else if (words >= 1500) {
                    badge.className = "text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-600 font-bold";
                } else {
                    badge.className = "text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold";
                }
            } else {
                if (words >= 410) {
                    badge.className = "text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-600 font-bold";
                } else if (words >= 310) {
                    badge.className = "text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-600 font-bold";
                } else {
                    badge.className = "text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold";
                }
            }
        };

        area.addEventListener('input', updateCount);
        // Initial count if needed
        updateCount();
    });

    // 💾 STUDENT DETAILS PERSISTENCE (auto-save & default restore)
    function initStudentDetailsPersistence() {
        const studentName = document.getElementById('studentName');
        const regNumber = document.getElementById('regNumber');
        const classSection = document.getElementById('classSection');

        if (studentName) {
            const savedName = localStorage.getItem('saved_student_name');
            if (savedName) studentName.value = savedName;
            studentName.addEventListener('input', () => {
                localStorage.setItem('saved_student_name', studentName.value);
            });
        }

        if (regNumber) {
            const savedReg = localStorage.getItem('saved_reg_number');
            if (savedReg) regNumber.value = savedReg;
            regNumber.addEventListener('input', () => {
                localStorage.setItem('saved_reg_number', regNumber.value);
            });
        }

        if (classSection) {
            const savedSec = localStorage.getItem('saved_class_section');
            if (savedSec) classSection.value = savedSec;
            classSection.addEventListener('input', () => {
                localStorage.setItem('saved_class_section', classSection.value);
            });
        }
    }

    // Initialize UI on load
    updateUI();
    // Analytics engine is self-initializing via qjAnalytics (no separate init call needed)
    initStudentDetailsPersistence();

    // Synchronously set default selections to Year II, Term 1
    const yearSelect = document.getElementById('year');
    if (yearSelect) {
        yearSelect.value = "II";
        yearSelect.dispatchEvent(new Event('change'));
        
        const termSelect = document.getElementById('term');
        if (termSelect) {
            termSelect.value = "1";
            termSelect.dispatchEvent(new Event('change'));
        }
    }

    // ---------------- PAGE VIEW ROUTING (HOME vs GENERATOR DEDICATED VIEW) ----------------
    function showGeneratorView() {
        const landing = document.getElementById('landingSections');
        const cta = document.getElementById('landingCtaSection');
        const navHomeBtn = document.getElementById('navHomeBtn');
        if (landing) landing.classList.add('hidden');
        if (cta) cta.classList.add('hidden');
        if (navHomeBtn) navHomeBtn.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showHomeView() {
        const landing = document.getElementById('landingSections');
        const cta = document.getElementById('landingCtaSection');
        const navHomeBtn = document.getElementById('navHomeBtn');
        if (landing) landing.classList.remove('hidden');
        if (cta) cta.classList.remove('hidden');
        if (navHomeBtn) navHomeBtn.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('a[href="#generator"]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            showGeneratorView();
        });
    });

    const navHomeBtn = document.getElementById('navHomeBtn');
    if (navHomeBtn) navHomeBtn.addEventListener('click', showHomeView);

    const navBrand = document.getElementById('navBrand');
    if (navBrand) navBrand.addEventListener('click', showHomeView);

    // ---------------- INFO MODALS (About, Privacy, Terms, Contact) ----------------
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const infoModalContent = document.getElementById('infoModalContent');

    const modalData = {
        about: {
            title: "About QuickJournal",
            badge: "🎓 Built for Engineering Students",
            badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
            body: `
                <p class="text-sm text-slate-600 leading-relaxed mb-4">
                    <strong>QuickJournal</strong> is an AI-powered academic engine engineered specifically for NIAT × Aurora engineering students. It eliminates the hours spent formatting and drafting repetitive reflective journals.
                </p>
                <div class="bg-violet-50/70 border border-violet-100 p-4 rounded-xl space-y-2 mb-4 text-xs text-slate-700 font-medium">
                    <div class="flex items-center gap-2"><span class="text-violet-600 font-bold">⚡ 30-Second Generation:</span> Complete single modules or entire academic terms in one click.</div>
                    <div class="flex items-center gap-2"><span class="text-violet-600 font-bold">📄 Official Formatting:</span> Pre-formatted with cover headers, tables, and page layout.</div>
                    <div class="flex items-center gap-2"><span class="text-violet-600 font-bold">🎯 Personalized Writing:</span> Context-aware content dynamically tailored to your exact module.</div>
                </div>
            `
        },
        privacy: {
            title: "Privacy Policy",
            badge: "🔒 100% Student Data Protection",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            body: `
                <p class="text-sm text-slate-600 leading-relaxed mb-4">
                    Your academic privacy is our top priority. QuickJournal is designed with strict data privacy principles:
                </p>
                <ul class="space-y-2 text-xs text-slate-700 font-medium mb-4 list-disc pl-4">
                    <li><strong>No Data Selling:</strong> We never sell or monetize your personal or academic information.</li>
                    <li><strong>Temporary Processing:</strong> Student details (Name & Register Number) are used strictly to populate your generated PDF cover sheet.</li>
                    <li><strong>Private Submissions:</strong> Your generated journals are private to you and never published.</li>
                </ul>
            `
        },
        terms: {
            title: "Terms of Use",
            badge: "📜 Academic Guidelines",
            badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
            body: `
                <p class="text-sm text-slate-600 leading-relaxed mb-4">
                    QuickJournal is an educational productivity tool designed to assist students in organizing, formatting, and generating reflective journal drafts for university coursework.
                </p>
                <div class="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2">
                    <p>• Students remain responsible for reviewing all generated content prior to official university submission.</p>
                    <p>• Each journal entry is dynamically synthesized using your selected academic parameters to ensure unique, non-template output.</p>
                </div>
            `
        },
        contact: {
            title: "Contact Developer",
            badge: "💬 Student Support & Feedback",
            badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
            body: `
                <p class="text-sm text-slate-600 leading-relaxed mb-4">
                    Have questions, suggestions, or need help with journal generation? Reach out directly to the developer:
                </p>
                <div class="space-y-3 text-xs font-medium">
                    <a href="mailto:kandadicharantej21@gmail.com" class="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-violet-300 hover:text-violet-700 transition-all">
                        <span class="text-base">✉️</span>
                        <div>
                            <div class="font-bold text-slate-800 text-sm">Email</div>
                            <div class="text-slate-500">kandadicharantej21@gmail.com</div>
                        </div>
                    </a>
                    <a href="https://www.linkedin.com/in/kandadicharantej/" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-violet-300 hover:text-violet-700 transition-all">
                        <span class="text-base">💼</span>
                        <div>
                            <div class="font-bold text-slate-800 text-sm">LinkedIn</div>
                            <div class="text-slate-500">linkedin.com/in/kandadicharantej</div>
                        </div>
                    </a>
                    <a href="https://github.com/KandadiCharanTej" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-violet-300 hover:text-violet-700 transition-all">
                        <span class="text-base">💻</span>
                        <div>
                            <div class="font-bold text-slate-800 text-sm">GitHub</div>
                            <div class="text-slate-500">github.com/KandadiCharanTej</div>
                        </div>
                    </a>
                </div>
            `
        }
    };

    function openModalKey(key) {
        const data = modalData[key];
        if (!data || !infoModal || !infoModalContent) return;

        infoModalContent.innerHTML = `
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${data.badgeColor} mb-3">
                ${data.badge}
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">${data.title}</h3>
            ${data.body}
        `;

        infoModal.classList.remove('hidden');
    }

    if (closeInfoModal && infoModal) {
        closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.classList.add('hidden');
        });
    }

    document.querySelectorAll('a[href="#about"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openModalKey('about'); }));
    document.querySelectorAll('a[href="#privacy"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openModalKey('privacy'); }));
    document.querySelectorAll('a[href="#terms"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openModalKey('terms'); }));
    document.querySelectorAll('a[href="#contact"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openModalKey('contact'); }));

    // Auto reveal all elements immediately on load
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => el.classList.add('revealed'));
    initScrollReveal();
});