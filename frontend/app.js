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
        const term4Container = document.getElementById('term4AssignmentContainer');
        const defaultJournalFields = [
            'experience', 'feelings', 'learning', 'application', 'conclusion'
        ];

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

        if (currentStep === 3) {
            updateStep3Layout();
        }
    }

    // 📊 JOURNAL COUNTER TRACKING (localStorage)
    function initJournalCounter() {
        let count = localStorage.getItem('total_journals_count');
        if (!count || parseInt(count, 10) < 1200) {
            count = 1200;
            localStorage.setItem('total_journals_count', count);
        } else {
            count = parseInt(count, 10);
        }
        updateJournalCountUI(count);
    }

    function formatBadgeCount(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K+';
        }
        return count + '+';
    }

    function updateJournalCountUI(count) {
        const badgePdf = document.getElementById('badgePdfCount');
        
        // Tooltip elements
        const tooltipPdf = document.getElementById('tooltipPdfCount');
        const tooltipStudents = document.getElementById('tooltipStudentsCount');
        const tooltipHours = document.getElementById('tooltipHoursCount');
        
        // Modal elements
        const modalPdf = document.getElementById('modalPdfCount');
        const modalStudents = document.getElementById('modalStudentsCount');
        const modalHours = document.getElementById('modalHoursCount');

        const studentsHelped = Math.floor(count / 12);
        const hoursSaved = Math.floor((count * 15) / 60);

        if (badgePdf) badgePdf.innerText = formatBadgeCount(count);
        
        if (tooltipPdf) tooltipPdf.innerText = count;
        if (tooltipStudents) tooltipStudents.innerText = studentsHelped;
        if (tooltipHours) tooltipHours.innerText = hoursSaved;

        if (modalPdf) modalPdf.innerText = count + "+";
        if (modalStudents) modalStudents.innerText = studentsHelped + "+";
        if (modalHours) modalHours.innerText = hoursSaved + "+";
    }

    function incrementJournalCounter() {
        let count = parseInt(localStorage.getItem('total_journals_count'), 10) || 1200;
        count++;
        localStorage.setItem('total_journals_count', count);
        updateJournalCountUI(count);
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

        if (term === "4") {
            assessSel.innerHTML = '<option value="" disabled selected>Select Assessment</option>';
            Object.keys(modules).forEach(num => {
                const moduleData = modules[num];
                const title = moduleData.title || `Assessment ${num}`;
                assessSel.innerHTML += `<option value="${num}">${title}</option>`;
            });
        } else {
            // Populate module dropdown with "Module I - Title" labels from data.js
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

    // 🛠️ CLIENT-SIDE ASSIGNMENT FALLBACK DATABASE & GENERATOR
    const assignmentFallbackDb = {
        "ecosystem": `An ecosystem is the fundamental structural and functional unit of the biosphere, representing a complex network of interactions between living organisms and their physical environment. The structure of an ecosystem is broadly divided into two main categories: biotic and abiotic components. Biotic components comprise all living entities, including producers (mainly green plants that synthesize organic compounds via photosynthesis), consumers (herbivorous and carnivorous animals that rely on producers for energy), and decomposers (bacteria and fungi that break down dead organic matter and recycle nutrients back into the soil). Abiotic components, on the other hand, include non-living physical and chemical factors such as sunlight, temperature, water, air, soil pH, and essential nutrients. The function of an ecosystem revolves around the flow of energy and the cycling of materials. Energy from the sun enters the system through autotrophic organisms, which convert solar energy into chemical energy. This energy is then transferred up the food chain as organisms consume one another. Decomposers play a critical role in nutrient cycling, ensuring that carbon, nitrogen, and phosphorus are returned to the environment, thus maintaining the sustainability of life. Understanding ecosystems helps us recognize the delicate interdependence of all species and the physical processes that regulate our biosphere's health.`,
        
        "ecological balance": `Ecological balance refers to a state of dynamic equilibrium within a community of organisms in which genetic, species, and ecosystem diversity remain relatively stable, subject to gradual evolutionary changes. The importance of maintaining this balance cannot be overstated, as it ensures the stability and survival of all life forms. In a balanced ecosystem, the population of each species is controlled by natural feedback loops, such as predator-prey dynamics, resource availability, and disease. For instance, if the population of herbivores increases, the food supply decreases, leading to starvation and a subsequent reduction in their population, which allows the vegetation to recover. Human activities, such as deforestation, urbanization, industrial pollution, and overhunting, introduce severe disruptions that ecosystems cannot easily absorb. When the ecological balance is upset, it can trigger cascading failures, leading to the extinction of species, loss of biodiversity, and the collapse of vital ecosystem services like water purification, pollination, and soil fertility. Protecting ecological balance requires conscious efforts, such as habitat conservation, sustainable resource management, and reduction of greenhouse gas emissions, ensuring that natural cycles can continue to function and support future generations.`,
        
        "food chain": `A food chain is a linear sequence of organisms through which nutrients and energy pass as one organism eats another. It represents the pathway of energy flow in an ecosystem and demonstrates the direct feeding relationships between different species. A classic example of a terrestrial food chain is: Grass (Producer) -> Grasshopper (Primary Consumer) -> Frog (Secondary Consumer) -> Snake (Tertiary Consumer) -> Hawk (Quaternary Consumer). In this chain, grass captures solar energy to produce glucose. The grasshopper consumes the grass to obtain energy, and is in turn eaten by the frog. This transfer continues until the hawk, as an apex predator, sits at the top of the chain. Each link in a food chain represents a transfer of biomass and energy. However, energy transfer is highly inefficient, with approximately 90% of the energy being lost as heat at each step, leaving only 10% available to the next trophic level. Additionally, food chains highlight the vulnerability of ecosystems to bioaccumulation and biomagnification, where toxic substances like heavy metals or synthetic pesticides accumulate in higher concentrations in apex predators, posing severe physiological threats and demonstrating the interconnectedness of all trophic levels.`,
        
        "trophic levels": `Trophic levels are the sequential steps in a food chain or food web, representing the feeding positions of group organisms based on how they obtain their energy. The first trophic level is occupied by autotrophs or producers, such as green plants and phytoplankton, which generate organic matter from solar energy. The second trophic level consists of primary consumers or herbivores, which feed directly on producers. The third trophic level comprises secondary consumers, which are carnivores that feed on herbivores. Tertiary consumers occupy the fourth trophic level, preying on other carnivores, while quaternary consumers represent apex predators at the very top. Additionally, decomposers operate across all trophic levels, breaking down dead organic matter and returning nutrients to the soil. The structure of trophic levels is governed by the laws of thermodynamics. As energy flows from one level to the next, a vast majority is dissipated through metabolic processes, respiration, and mechanical work. This thermodynamic loss, formalized in Lindeman's ten percent law, limits the number of trophic levels in an ecosystem to usually four or five, as there is insufficient energy at higher levels to support viable populations of apex predators.`,
        
        "ecological pyramids": `Ecological pyramids are graphical representations designed to show the biomass, energy, or population at each trophic level in a given ecosystem. Introduced by Charles Elton, these pyramids provide a visual summary of ecosystem structure and trophic efficiency. There are three primary types of ecological pyramids. The Pyramid of Numbers represents the total number of individual organisms at each level. It can be upright, as in a grassland where millions of grass blades support fewer herbivores and even fewer carnivores, or inverted, as in a forest where a single tree supports thousands of insects. The Pyramid of Biomass represents the total dry weight of organic matter at each level. While terrestrial biomass pyramids are generally upright, marine ecosystems often exhibit inverted biomass pyramids, where a small biomass of rapidly reproducing phytoplankton supports a larger biomass of zooplankton and fish. The Pyramid of Energy depicts the total amount of energy present at each level over a specific period. Unlike the other two, the energy pyramid is always upright, reflecting the thermodynamic reality that energy is lost as heat during transfer, making it impossible for a higher trophic level to possess more energy than the level below it.`,
        
        "pyramid of energy": `The pyramid of energy is a graphical model that shows the flow of energy through the trophic levels of an ecosystem over a given time period. It is considered the most accurate representation of ecosystem thermodynamics because it reflects the rate of energy passage rather than static biomass or numbers. The energy pyramid is always upright, without exception. This shape is dictated by the Second Law of Thermodynamics, which states that when energy is transformed or transferred, a portion of it is inevitably lost as disorganized heat. In ecological terms, only about 10% of the energy stored as biomass in one trophic level is converted into biomass in the next level (Lindeman's efficiency rule). The remaining 90% is expended on respiration, movement, reproduction, and excretion, or remains unconsumed as detritus. Consequently, the energy available to support life decreases exponentially as one moves upward. For example, if producers capture 10,000 joules of solar energy, herbivores will obtain only 1,000 joules, secondary consumers will get 100 joules, and tertiary consumers will receive a mere 10 joules. This steep energy decline explains why food chains are short and why top predators are relatively rare and highly vulnerable to habitat fragmentation.`,
        
        "carbon cycle": `The carbon cycle is the biogeochemical process by which carbon is exchanged among the biosphere, pedosphere, geosphere, hydrosphere, and atmosphere of the Earth. Carbon is the foundational element of all organic molecules, and its circulation is critical for maintaining life and regulating the global climate. The cycle operates through several key processes. Photosynthesis by terrestrial plants and marine phytoplankton absorbs atmospheric carbon dioxide (CO2) and converts it into organic carbon (glucose). Respiration by plants, animals, and microbes releases CO2 back into the atmosphere as organic compounds are broken down for energy. Decomposition of dead organisms by fungi and bacteria also returns carbon to the soil and atmosphere. Over millions of years, organic matter buried under high pressure forms fossil fuels, sequestering carbon deep underground. Marine carbon is sequestered through the formation of calcium carbonate shells by marine organisms, which eventually settle to form limestone. Human interventions, primarily the burning of fossil fuels and widespread deforestation, have severely disrupted the carbon cycle by releasing sequestered carbon into the atmosphere at an unprecedented rate, driving the greenhouse effect and ocean acidification.`,
        
        "nitrogen cycle": `The nitrogen cycle is the biogeochemical process through which nitrogen is converted into various chemical forms, circulating between the atmosphere, terrestrial, and marine ecosystems. Although nitrogen gas (N2) makes up 78% of the Earth's atmosphere, it is chemically unreactive and cannot be directly utilized by most living organisms. The cycle relies on specialized microorganisms to transition nitrogen through five essential stages: nitrogen fixation, nitrification, assimilation, ammonification, and denitrification. During nitrogen fixation, atmospheric N2 is converted into ammonia (NH3) by symbiotic bacteria like Rhizobium in root nodules of legumes, or by free-living bacteria like Azotobacter. Nitrification is a two-step aerobic process where ammonia is oxidized to nitrites (NO2-) by Nitrosomonas and then to nitrates (NO3-) by Nitrobacter. Plants assimilate these nitrates to synthesize amino acids and nucleic acids. Ammonification occurs when decomposers break down organic nitrogenous waste back into ammonia. Finally, denitrification converts nitrates back into N2 gas under anaerobic conditions by bacteria like Pseudomonas, completing the cycle. Anthropogenic actions, such as the heavy application of synthetic fertilizers and burning of fossil fuels, have doubled the rate of global nitrogen fixation, causing soil acidification and eutrophication of aquatic ecosystems.`,
        
        "greenhouse effect": `The greenhouse effect is a natural physical process by which greenhouse gases in the Earth's atmosphere trap heat radiated from the planet's surface, keeping the global climate warm enough to support life. Solar radiation passes through the clear atmosphere and warms the Earth's surface. The Earth then radiates this energy back toward space as infrared radiation. Greenhouse gases (GHGs)—primarily water vapor, carbon dioxide (CO2), methane (CH4), nitrous oxide (N2O), and ozone (O3)—absorb this thermal infrared radiation and re-emit it in all directions, including back down to the surface, warming the lower atmosphere. Without this natural greenhouse effect, the Earth's average surface temperature would be a frozen -18°C instead of the current comfortable 15°C. However, industrialization, characterized by coal and oil combustion, agricultural expansion, and deforestation, has significantly increased atmospheric GHG concentrations. This enhanced greenhouse effect traps excess heat, leading to global warming, rising sea levels, shifting precipitation patterns, and an increase in extreme weather events, threatening human societies and biodiversity.`,
        
        "ozone layer depletion": `Ozone layer depletion refers to the gradual thinning and destruction of the stratospheric ozone layer, situated approximately 15 to 30 kilometers above the Earth's surface. The ozone layer plays a critical role in shielding life on Earth by absorbing up to 98% of the sun's high-frequency ultraviolet (UV-B and UV-C) radiation, which is harmful to DNA and can cause skin cancers, cataracts, and crop damage. The primary drivers of ozone depletion are manufactured chemicals known as Ozone-Depleting Substances (ODS), which include chlorofluorocarbons (CFCs), halons, carbon tetrachloride, and methyl chloroform. When these gases reach the stratosphere, UV light breaks them down to release chlorine and bromine atoms. A single chlorine atom can catalytically destroy over 100,000 ozone molecules before being removed from the atmosphere. The depletion is most severe over Antarctica during spring, creating the famous "ozone hole." The global response, marked by the adoption of the Montreal Protocol in 1987, has successfully phased out the production of most ODSs, allowing the ozone layer to slowly recover and demonstrating the power of international environmental cooperation.`,
        
        "air pollution, its sources": `Air pollution is the introduction of harmful chemical substances, particulate matter, or biological molecules into the Earth's atmosphere, causing adverse health effects in humans, damage to other living organisms, and disruption of natural ecosystems. Air pollutants are classified into primary pollutants, which are emitted directly from sources (such as carbon monoxide, sulfur dioxide, nitrogen oxides, and particulate matter), and secondary pollutants, which form in the atmosphere through chemical reactions (such as ground-level ozone and photochemical smog). The sources of air pollution are divided into anthropogenic and natural categories. Anthropogenic sources include stationary sources like power plants, oil refineries, and industrial factories, as well as mobile sources such as automobiles, aircraft, and marine vessels. Agricultural activities, including livestock waste and synthetic fertilizers, release ammonia and methane, while domestic wood burning is a major source of fine particulates. Natural sources include volcanic eruptions, forest fires, windblown dust, and organic compounds emitted by vegetation. Exposure to polluted air leads to severe respiratory infections, cardiovascular diseases, lung cancer, and contributes to acid rain and global climate change.`,
        
        "air pollution control devices": `Air pollution control devices are engineering technologies designed to capture, destroy, or reduce particulate matter and gaseous pollutants from industrial and vehicular emissions before they are released into the atmosphere. The choice of control device depends on the physical and chemical properties of the pollutant, gas stream flow rate, and environmental regulations. For controlling particulate matter, common devices include Electrostatic Precipitators (ESPs), which use electrical forces to charge and collect fine particles on plates; Fabric Filters or Baghouses, which pass exhaust gas through woven bags to trap dust; Cyclone Separators, which utilize centrifugal force to separate heavier particles; and Wet Scrubbers, which wash the gas stream with liquid spray. For gaseous pollutants, control technologies include Absorption Towers (using liquid solvents), Adsorption Beds (using active carbon to bind molecules), and Thermal Oxidizers (burning VOCs). Catalytic converters in automobiles play a major role in reducing vehicular emissions by converting toxic nitrogen oxides, carbon monoxide, and hydrocarbons into harmless nitrogen, carbon dioxide, and water vapor, contributing significantly to urban air quality management.`,
        
        "noise pollution": `Noise pollution is defined as the propagation of unwanted, disturbing, or excessive sound that interferes with the normal activities of humans and wildlife, leading to degradation of health and environmental quality. Measured in decibels (dB), noise becomes harmful when it exceeds 75 to 80 dB. The primary sources of noise pollution include transportation systems (traffic, aircraft, and railways), industrial machinery, construction activities, loud public address systems, and domestic appliances. Unlike water and air pollution, noise does not leave chemical residues, but its physiological and psychological impacts on humans are profound. Prolonged exposure to high noise levels can cause noise-induced hearing loss, hypertension, sleep disruption, elevated stress hormones, cognitive impairment in children, and cardiovascular disease. In wildlife, noise pollution disrupts communication, mating rituals, predator-prey dynamics, and forces animals to abandon their natural habitats, highlighting the need to treat acoustic comfort as an essential component of urban planning and public health.`,
        
        "noise measured": `Noise is measured using a specialized instrument called a Sound Level Meter, which detects changes in air pressure caused by sound waves and converts them into decibel (dB) values. Because the human ear is not equally sensitive to all sound frequencies, measurements are usually adjusted using a frequency-weighting network. The most common is 'A-weighting' (expressed as dBA), which mimics the response of the human ear to low and moderate sound levels, emphasizing mid-range frequencies where human hearing is most sensitive. Prevention and control measures for noise pollution are divided into source, transmission path, and receiver levels. At the source, noise can be reduced through lubricating machinery, installing silencers or mufflers, and designing quieter engines. Along the transmission path, noise barriers, acoustic panels, double-glazed windows, and green belts (dense tree plantations) help absorb and scatter sound waves. At the receiver end, workers in high-noise environments should use Personal Protective Equipment (PPE) like earplugs or earmuffs. Proper urban planning, zoning industrial zones away from residential areas, and restricting heavy vehicle movement at night are crucial systemic measures for mitigating noise exposure.`,
        
        "noise pollution rules": `The Noise Pollution (Regulation and Control) Rules represent legal frameworks enacted by governments to regulate, restrict, and control noise levels in public spaces, residential areas, commercial centers, and industrial zones. In India, these rules were established under the Environment (Protection) Act, 1986. The legislation divides urban regions into four categories, prescribing maximum permissible noise limits for day (6:00 AM to 10:00 PM) and night (10:00 PM to 6:00 AM). In Industrial zones, the limits are set at 75 dB during the day and 70 dB at night. Commercial areas are restricted to 65 dB (day) and 55 dB (night), while Residential areas have lower thresholds of 55 dB (day) and 45 dB (night). The rules also define 'Silence Zones'—areas within 100 meters of hospitals, educational institutions, courts, and religious places—restricting noise to 50 dB (day) and 40 dB (night). The regulations prohibit the use of loudspeakers or public address systems at night without written permission, set strict noise standards for firecrackers and vehicles, and empower local police and pollution control boards to impose fines, confiscate equipment, and prosecute violators.`,
        
        "water pollution": `Water pollution is the contamination of water bodies—including lakes, rivers, oceans, aquifers, and groundwater—usually as a result of human activities, making the water unfit for drinking, agriculture, industry, or supporting aquatic life. It is categorized by its source into point source pollution (emissions from a single, identifiable source like an industrial pipe) and non-point source pollution (diffuse runoff from agricultural fields or urban streets). The major types of water pollutants include organic pollutants (pathogens, sewage, and food waste), chemical pollutants (heavy metals like mercury and lead, synthetic pesticides, and industrial solvents), nutrient pollutants (phosphates and nitrates from fertilizers), and physical pollutants (sediment and thermal waste). When nutrients enter water bodies, they trigger eutrophication—an algal bloom that depletes dissolved oxygen as the algae decompose, creating aquatic "dead zones" devoid of life. Water pollution directly threatens human health through waterborne diseases, disrupts aquatic food webs, and bioaccumulates toxins in fish, highlighting the critical importance of treating wastewater before discharge.`,
        
        "surface water": `Surface water and groundwater pollution represent two interconnected dimensions of freshwater contamination, each governed by distinct environmental mechanisms. Surface water pollution affects rivers, lakes, reservoirs, and estuaries, and is primarily driven by direct discharges of industrial effluent, municipal sewage, and agricultural runoff containing fertilizers and pesticides. Because surface water is exposed to the atmosphere, it can benefit from natural aeration and dilution, but is highly vulnerable to rapid contamination and eutrophication. Groundwater pollution occurs when contaminants leach through the soil and enter underground aquifers. The major sources of groundwater pollution include leaking underground storage tanks (containing petroleum or chemicals), agricultural chemicals percolating downward, septic tank leakage, and hazardous leachate from unlined landfills. Unlike surface water, groundwater moves extremely slowly, is devoid of sunlight, and has minimal microbial activity, meaning that once an aquifer is contaminated, the pollution is persistent, difficult to detect, and incredibly expensive to remediate, posing long-term health risks to communities relying on wells.`,
        
        "water quality parameters": `Water quality parameters are physical, chemical, and biological measurements used to assess the safety and health of water resources for various uses. The pH value measures the acidity or alkalinity of water on a scale of 0 to 14, with a neutral range of 6.5 to 8.5 required for most aquatic life. Turbidity measures the cloudiness or clarity of water caused by suspended particles, indicating sediment runoff or algal growth. Total Solids (TS) and Total Suspended Solids (TSS) measure the dissolved and suspended particulate matter in water; high TSS blocks sunlight and can harm aquatic respiration. Biochemical Oxygen Demand (BOD) is a critical chemical parameter that measures the amount of dissolved oxygen required by aerobic microorganisms to decompose organic matter in a water sample over a specific period. High BOD indicates heavy organic pollution. Chemical Oxygen Demand (COD) measures the total organic compounds that can be chemically oxidized, providing a faster assessment of both biodegradable and non-biodegradable pollutants. Together, these parameters help environmental engineers monitor pollution levels, assess treatment efficiency, and enforce compliance.`,
        
        "stages of wastewater treatment": `Wastewater treatment is a multi-stage process designed to remove physical, chemical, and biological contaminants from municipal sewage and industrial effluents before the cleaned water is discharged back into natural water bodies or reused. The process is divided into three major stages. Preliminary and Primary treatment focus on physical separation. Preliminary treatment uses bar screens and grit chambers to remove large objects like rags, wood, and gravel. Primary treatment then runs the sewage through large settling tanks (clarifiers), where heavier organic solids settle to the bottom as sludge, and oil and grease rise to the top to be skimmed off, removing about 50-60% of suspended solids. Secondary treatment is a biological process that utilizes microorganisms to aerate and consume dissolved organic matter, using methods like the Activated Sludge Process or Trickling Filters. Tertiary treatment is the final advanced chemical or physical purification stage, employing sand filtration, carbon adsorption, nutrient removal (for nitrogen and phosphorus), and disinfection using chlorine, ozone, or UV radiation to produce high-quality effluent safe for reclamation.`,
        
        "primary, secondary, and tertiary": `Primary, secondary, and tertiary treatments represent the successive phases of wastewater engineering, each targeting specific types of water pollutants. Primary treatment is a physical operation designed to remove floating and settleable solids. Wastewater is directed into sedimentation tanks where gravity separates particles; primary sludge is pumped out, and scum is removed from the surface. This phase reduces organic loading but leaves dissolved pollutants untouched. Secondary treatment is a biological process that exploits the natural degradation capabilities of bacteria and other microbes. In aeration tanks, oxygen is supplied to encourage bacteria to consume dissolved organic matter, converting it into carbon dioxide, water, and cellular mass. This mixture then flows to secondary clarifiers, where the microbial biomass settles out as activated sludge. Tertiary treatment represents advanced chemical and physical treatment for removing remaining suspended solids, dissolved inorganic salts, and biological nutrients like nitrogen and phosphorus, which can trigger eutrophication. Techniques include chemical precipitation, activated carbon adsorption, reverse osmosis, and final disinfection, yielding highly purified water suitable for industrial reuse or irrigation.`,
        
        "soil pollution": `Soil pollution is the contamination of soil with anomalous concentrations of toxic chemicals, radioactive substances, pathogens, or industrial waste, reducing agricultural productivity and posing severe risks to human health and groundwater quality. The primary causes of soil pollution include agricultural activities (overuse of synthetic fertilizers, chemical pesticides, and herbicides), industrial waste disposal (uncontrolled dumping of toxic effluents and heavy metals), accidental oil spills, acid rain deposition, and leachate from unlined municipal landfills. The effects of soil pollution are long-lasting; heavy metals like lead, cadmium, and arsenic remain in the soil matrix, where they are absorbed by crops and enter the human food chain through bioaccumulation. This can lead to chronic kidney damage, cancers, and neurological disorders. Control measures include restricting the use of persistent pesticides, adopting organic farming, implementing proper industrial waste treatment, and applying remediation techniques such as bioremediation (using microbes to degrade toxins) and phytoremediation (using hyperaccumulating plants to extract heavy metals from the soil).`,
        
        "solar energy": `Solar energy is the radiant light and heat from the Sun that is harnessed using a range of evolving technologies, representing the most abundant renewable energy resource on Earth. The primary technology for converting sunlight into electricity is Photovoltaics (PV), which utilizes semiconductor materials like silicon. When sunlight strikes the PV cell, it excites electrons, creating an electrical current through the photoelectric effect. Solar thermal systems represent another key application, using mirrors or lenses to concentrate sunlight to heat water or synthetic oil to generate steam, which drives turbines to produce electricity. Solar energy is also utilized for passive solar heating, crop drying, and water desalination. The benefits of solar energy include its carbon-free operation, reduction of air pollution, and decentralization of energy systems, which increases grid resilience. However, challenges such as solar intermittency (due to night and cloud cover), the need for land area, high initial capital costs, and grid integration require continued development of battery storage technologies and smart grid management.`,
        
        "biomass energy": `Biomass energy is renewable organic energy derived from plants and animal wastes, representing a carbon-neutral energy source because the carbon dioxide released during its combustion is equivalent to the carbon absorbed by the plants during their growth. Biomass can be converted into energy through direct combustion to produce heat, chemical conversion to produce liquid biofuels (like ethanol and biodiesel), or biochemical conversion. Biogas production is a key biochemical method, occurring through the Anaerobic Digestion of organic wastes, such as cow dung, agricultural residues, and municipal sewage, by methanogenic bacteria in the absence of oxygen. The digestion process occurs in four stages: hydrolysis, acidogenesis, acetogenesis, and methanogenesis. The resulting biogas is composed primarily of methane (55-75%) and carbon dioxide (25-45%), with trace amounts of hydrogen sulfide. Biogas serves as a clean cooking fuel and can run generators to produce electricity in rural areas. The byproduct, digested slurry, is rich in nitrogen and phosphorus, acting as an excellent organic fertilizer that improves soil structure and closes the nutrient loop.`,
        
        "wind energy": `Wind energy is a form of solar energy generated by the uneven heating of the atmosphere by the sun, the irregularities of the earth's surface, and the rotation of the earth. Wind turbines harness this kinetic energy, converting it into mechanical power and then into electricity using generators. Turbines consist of aerodynamic rotor blades, a nacelle containing a gearbox and generator, and a tower. As wind flows across the blades, it creates lift, forcing the rotor to spin. The efficiency of wind power is governed by the power curve of the turbine and wind speed, with power output proportional to the cube of the wind speed. Wind energy systems offer substantial benefits, including zero greenhouse gas emissions during operation, low operational costs, and compatibility with agricultural land use, as crops can be grown around the turbine towers. Challenges include the variability of wind patterns, aesthetic and noise concerns for nearby residents, and potential ecological impacts on birds and bats. The development of offshore wind farms, where winds are stronger and more consistent, represents a major expansion frontier for global renewable grids.`,
        
        "hydrogen energy": `Hydrogen energy is a highly versatile clean energy carrier that produces only water vapor and heat when combusted or used in a fuel cell, making it a cornerstone of future zero-emission economies. Hydrogen is not a primary energy source; it must be extracted from compounds like water or hydrocarbons. The environmental benefit of hydrogen depends on its production pathway, categorized by color codes. Grey hydrogen is produced from natural gas using Steam Methane Reforming (SMR), releasing carbon dioxide. Blue hydrogen utilizes SMR coupled with Carbon Capture and Storage (CCS) to mitigate emissions. Green hydrogen, the gold standard, is produced through the Electrolysis of water using electricity derived entirely from renewable sources like solar or wind. In a hydrogen fuel cell, hydrogen and oxygen undergo an electrochemical reaction to produce direct current electricity, with water as the sole byproduct. Applications include powering heavy duty transport (trucks, ships, trains), storing excess grid energy, and decarbonizing heavy industries like steel manufacturing and chemical refining. Challenges include high storage costs, low density requiring high compression, and safety concerns.`,
        
        "tidal energy": `Tidal energy and ocean energy represent a diverse set of renewable energy technologies that harness the mechanical, thermal, and chemical energy of the ocean to generate electricity. Tidal energy is generated by the gravitational pull of the Moon and Sun, combined with the rotation of the Earth, creating predictable rises and falls in sea levels. This energy can be captured using tidal barrages (dam-like structures built across estuaries that force water through turbines as tides ebb and flow), tidal lagoons, or tidal stream turbines (underwater wind-like turbines placed in high-velocity tidal currents). Ocean energy also includes Wave Energy (harnessing the kinetic energy of wind-driven surface waves using floating buoys or oscillating water columns) and Ocean Thermal Energy Conversion (OTEC), which exploits the temperature difference between warm surface waters and cold deep ocean waters to run heat engines. The benefits of ocean energy are its predictability and immense power density. However, high capital costs, harsh corrosive marine environments, and potential disruptions to local marine ecosystems remain barriers to large-scale commercial deployment.`,
        
        "geothermal energy": `Geothermal energy is the heat energy originating from the Earth's core, representing a stable, highly reliable, and continuous source of renewable energy that is independent of weather conditions. The heat is generated by the decay of naturally radioactive isotopes, such as uranium, thorium, and potassium, combined with primordial heat retained from the Earth's formation. Geothermal resources are tapped by drilling deep wells to access hydrothermal reservoirs of hot water and steam. There are three main types of geothermal power plants: Dry Steam plants (using steam directly from the reservoir to spin turbines), Flash Steam plants (pulling high-pressure hot water into lower-pressure tanks to create steam), and Binary Cycle plants (passing moderately hot geothermal water through a heat exchanger to vaporize a working fluid with a lower boiling point). Geothermal heat is also used directly for district heating, greenhouses, aquaculture, and geothermal heat pumps for residential climate control. While highly sustainable and space-efficient, challenges include localized emissions of hydrogen sulfide, potential land subsidence, and high initial exploration risks.`,
        
        "environmental benefits": `Alternative energy sources—including solar, wind, biomass, geothermal, hydrogen, and ocean energy—offer critical environmental benefits that are essential for mitigating global climate change and preserving biosphere integrity. The most significant benefit is the drastic reduction in greenhouse gas emissions; unlike fossil fuels, renewable energy technologies generate little to no carbon dioxide during operation, helping stabilize global temperatures and prevent catastrophic climate tipping points. Transitioning to alternative energy also eliminates major sources of air pollution, reducing emissions of sulfur dioxide, nitrogen oxides, and fine particulate matter that cause severe respiratory and cardiovascular health problems in humans. Additionally, these technologies conserve freshwater resources, as solar PV and wind turbines require virtually no water for cooling compared to traditional coal or nuclear power plants. Future prospects for alternative energy are highly promising, driven by rapid declines in technology costs, advancements in grid-scale battery storage, and supportive government policies, pointing toward a decentralized, resilient, and fully decarbonized global energy grid.`,
        
        "e-waste management": `Electronic Waste, or E-Waste, refers to discarded electrical or electronic devices, representing the fastest-growing waste stream in the modern digital world. E-waste is highly hazardous because it contains toxic heavy metals, including lead, mercury, cadmium, and hexavalent chromium, alongside brominated flame retardants, which can leach into soil and groundwater from unlined landfills, causing severe neurological and reproductive damage in humans. E-waste management revolves around the 3R Principles: Reduce, Reuse, and Recycle. 'Reduce' encourages manufacturing durable, modular electronics that are easy to repair, limiting obsolescence. 'Reuse' focuses on extending the lifecycle of electronics through donating, reselling, or refurbishing used devices. 'Recycle' involves the safe extraction of valuable resources, such as gold, copper, silver, and rare earth elements, from discarded electronics, which reduces the environmental degradation associated with mining raw ores. Achieving sustainable e-waste management requires implementing Extended Producer Responsibility (EPR) regulations, establishing formal recycling facilities, and raising consumer awareness regarding safe disposal methods.`,
        
        "environmental legislation": `Environmental legislation represents the body of laws, regulations, and treaties enacted by governments to protect natural resources, control pollution, and enforce sustainable industrial practices. In India, key legislations include the Water (Prevention and Control of Pollution) Act of 1974, the Air (Prevention and Control of Pollution) Act of 1981, and the comprehensive Environment (Protection) Act of 1986, which grants the central government broad authority to regulate emissions, handle hazardous substances, and coordinate state-level pollution control boards. Alongside national laws, international voluntary frameworks such as the ISO 14000 series establish global standards for Environmental Management Systems (EMS). ISO 14001, the core standard, provides a structured framework for organizations to identify environmental impacts, set performance targets, implement control measures, and continuously audit and improve their environmental performance. Adherence to these standards helps corporations reduce waste, achieve regulatory compliance, minimize carbon footprints, and demonstrate corporate environmental responsibility.`,
        
        // Indian Heritage and Culture Fallback DB
        "sanchi stupa": `The Sanchi Stupa, located in Madhya Pradesh, is one of the oldest stone structures in India and a monumental masterpiece of Buddhist art and architecture. Commissioned by Emperor Ashoka the Great in the 3rd century BCE, the stupa was originally a simple hemispherical brick structure built over the relics of Lord Buddha, later encased in stone during the Shunga period. Its architectural significance lies in its symbolic representation of the cosmic universe. The semi-spherical dome (anda) represents the vault of heaven, surmounted by a square railing (harmika) symbolizing the sacred enclosure, and a central pillar supporting three stone umbrellas (chatras) representing the three jewels of Buddhism: Buddha, Dharma, and Sangha. The stupa is globally renowned for its four magnificently carved stone gateways (toranas), added in the 1st century BCE under the Satavahanas. These gateways are covered with detailed narrative relief sculptures depicting scenes from the life of Buddha, Jataka tales of his previous incarnations, and various symbolic representations, making Sanchi Stupa an invaluable cultural repository of early Buddhist art and philosophy.`,
        
        "ajanta caves": `The Ajanta Caves, situated in the Aurangabad district of Maharashtra, are a horse-shoe-shaped bend of 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE to the 5th century CE. Excavated out of the vertical basalt cliff of the Sahyadri hills, these caves served as monasteries (viharas) and prayer halls (chaityas) for Buddhist monks. The artistic features of Ajanta are represented by its world-famous mural paintings, which are the finest surviving examples of ancient Indian art. Painted using a tempera technique on mud plaster, the murals depict the life of Buddha and the Jataka stories with extraordinary emotional depth, expressive gestures, and naturalistic modeling. Iconic murals, such as those of the Bodhisattvas Padmapani (the lotus-bearer) and Vajrapani (the thunderbolt-bearer) in Cave 1, showcase the pinnacle of classical Indian painting. Historically, Ajanta provides deep insights into the evolution of Buddhist sectarian practices, transition from Hinayana (aniconic) to Mahayana (iconic) phases, and the patterns of royal patronage under the Vakataka dynasty, earning its designation as a UNESCO World Heritage Site.`,
        
        "konark sun temple": `The Konark Sun Temple, situated on the coastline of Odisha, is a monumental culmination of Kalinga temple architecture and an outstanding testament to medieval Indian engineering excellence. Built in the 13th century CE by King Narasimhadeva I of the Eastern Ganga Dynasty, the temple was designed as a colossal stone chariot for Surya, the Sun God. The temple structure is aligned on an east-west axis, featuring 24 intricately carved stone wheels, each about 10 feet in diameter, drawn by a team of seven rearing horses representing the days of the week. The engineering genius of Konark lies in its astronomical precision and structural scale. The wheels of the chariot are not merely decorative; they function as precise sundials, where the shadows cast by the spokes indicate the exact time of day down to minutes. The construction utilized massive iron beams to reinforce the stone lintels, and the crowning magnet (lodestone) at the top of the main sanctuary was historically said to align the iron plates and keep the main deity suspended in mid-air, representing an advanced mastery of physics and structural mechanics.`,
        
        "taj mahal": `The Taj Mahal, located on the banks of the Yamuna River in Agra, is universally recognized as a supreme masterpiece of Indo-Islamic architecture and a monument of unparalleled heritage value. Built between 1631 and 1648 CE by the Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal, the monument represents the ultimate refinement of Mughal architectural synthesis, blending Persian, Turkish, Islamic, and indigenous Indian design elements. The architectural beauty of the Taj Mahal is defined by its absolute bilateral symmetry, the use of pure white Makrana marble that reflects different hues of light throughout the day, and its grand double-dome structure. The exterior and interior surfaces are decorated with exquisite 'pietra dura' inlay work, where semi-precious stones like lapis lazuli, jade, and jasper are embedded into the marble to form intricate floral patterns. Surrounded by a classical Charbagh garden layout with reflecting pools, the Taj Mahal stands as a symbol of artistic perfection, engineering precision, and a timeless monument to human love and structural aesthetics.`,
        
        "mahabalipuram": `The monoliths of Mahabalipuram and the grand scale of the Red Fort represent two distinct peaks of ancient and medieval Indian engineering. Mahabalipuram, situated on the coast of Tamil Nadu, showcases the pioneering stone-carving engineering of the Pallava dynasty in the 7th and 8th centuries CE. Its rock-cut temples, particularly the Pancha Rathas (five monolithic structures carved out of single granite boulders), and the Shore Temple demonstrate an advanced understanding of lithic technology, quarrying, and structural stability against coastal erosion. The Relief carving 'Descent of the Ganges' is a monumental engineering feat of open-air rock sculpture. In contrast, the Red Fort in Delhi, built by Shah Jahan in the 17th century, represents the zenith of medieval military and palace architecture. Constructed using massive red sandstone blocks, the fort features sophisticated defensive walls, grand audience halls (Diwan-i-Aam and Diwan-i-Khas), and an advanced canal network called the 'Nahr-i-Bihisht' (Stream of Paradise) that circulated water through the palace chambers for cooling, showcasing an integration of hydro-engineering and palace design.`,
        
        "indian festivals": `Indian festivals play a central role in preserving and transmitting the country's rich cultural traditions across generations. India's cultural landscape is characterized by a continuous cycle of celebrations that are deeply rooted in mythology, agriculture, and spirituality. Festivals like Diwali, Holi, Dussehra, Pongal, Makar Sankranti, Eid, Christmas, and Guru Nanak Jayanti act as living museums of folklore, music, dance, traditional attire, and culinary arts. They provide a structural framework for communities to gather, share collective joy, and reinforce moral values of charity, gratitude, and righteousness. By participating in traditional rituals, making specific crafts, and reciting historical narratives during these occasions, younger generations are introduced to their historical roots and social values. Festivals also support local economies by promoting traditional artisans, weavers, and small businesses. Ultimately, these celebrations ensure that ancient traditions do not become stagnant historical memories but remain dynamic, active components of contemporary Indian life, fostering a deep sense of cultural continuity.`,
        
        "rituals and customs": `Rituals and customs form the social and cultural bedrock of Indian society, playing a vital role in maintaining social order, community cohesion, and individual moral development. In the Indian tradition, life is structured around a series of rites of passage known as 'Sanskaras' (sacraments), which guide an individual from birth to death, reinforcing spiritual, familial, and social responsibilities. Customs governing family structures, marriage ceremonies, respect for elders, community dining, and agricultural cycles encourage a collective orientation over individualism. These rituals serve as a bridge between the past and the present, ensuring the transmission of ancestral wisdom, moral codes, and social norms. In a vast country, these shared customs create a predictable social fabric that binds diverse families together. While some rituals have evolved to suit modern lifestyles, their core purpose remains the preservation of ethical values, the expression of gratitude toward nature and community, and the maintenance of a stable, harmonious social structure that values family ties and mutual respect.`,
        
        "regional traditions": `Regional traditions are the driving force behind India's rich cultural diversity, turning the subcontinent into a vibrant mosaic of coexisting identities. Each state and community in India possesses its own unique dialect, folklore, musical styles, classical and folk dances, traditional attire, and distinct culinary habits, shaped by regional geography and history. From the classical Carnatic music of the South to the Sufi Qawwalis of the North, and from the energetic Bhangra of Punjab to the graceful Bihu of Assam, these traditions represent localized expressions of human experience. Far from dividing the nation, these diverse traditions have historically engaged in a process of mutual exchange and syncretism, creating a shared cultural consciousness. Regional traditions allow individuals to express their local identities while participating in the broader national narrative. This pluralism promotes tolerance and adaptability, enabling different communities to live in harmony and demonstrating that India's strength lies not in uniformity, but in its rich, multi-layered cultural diversity.`,
        
        "seasonal festivals": `Religious and seasonal festivals celebrated across India reflect the country's deep connections with nature, agrarian cycles, and spiritual diversity. Seasonal festivals are directly linked to the agricultural calendar, celebrating harvest, sowing, and the changing of seasons. Makar Sankranti, celebrated under various names such as Bihu in Assam, Pongal in Tamil Nadu, Lohri in Punjab, and Uttarayan in Gujarat, marks the transition of the Sun into the zodiac sign of Capricorn and the arrival of longer days, characterized by kite flying, bonfires, and community feasts using freshly harvested grains. Similarly, Basant Panchami welcomes spring, while Onam in Kerala celebrates the harvest and the return of the legendary King Mahabali. Alongside these agrarian celebrations, religious festivals like Diwali (the festival of lights), Holi (the festival of colors), Eid-ul-Fitr (marking the end of Ramadan), Durga Puja, and Christmas are celebrated with immense devotion, transcending regional barriers. These festivals highlight how secular agricultural cycles and diverse religious traditions blend together to define the rhythmic pattern of Indian community life.`,
        
        "unity, harmony": `Indian festivals are powerful catalysts for promoting unity, social harmony, and ethical values among people of different backgrounds. In a multi-religious and multi-cultural society, festivals serve as platforms for inter-community interaction, breaking down social barriers and fostering mutual respect. During major celebrations like Diwali, Holi, and Eid, it is common for people of different faiths to visit one another, exchange sweets, and participate in community feasts. The tradition of community kitchens, such as the 'Langar' in Sikh Gurdwaras, exemplifies the democratic spirit of equality, where people sit together on the floor to share a meal regardless of caste, creed, or economic status. Festivals emphasize core human values such as the victory of light over darkness (good over evil), compassion for the underprivileged through charity (such as Zakat during Eid), and respect for nature (expressed in harvest festivals). By bringing people together in shared celebration, festivals build social capital, reinforce mutual tolerance, and strengthen the pluralistic fabric of Indian society.`,
        
        "c. v. raman": `Sir Chandrasekhara Venkata Raman was one of modern India's most illustrious scientists, whose groundbreaking research in physics placed India on the global map of modern scientific achievements. In 1930, C. V. Raman became the first Indian and Asian to receive the Nobel Prize in Physics for his discovery of the 'Raman Effect' at the Indian Association for the Cultivation of Science in Kolkata. The Raman Effect refers to the phenomenon of inelastic scattering of light, where a beam of light passing through a transparent chemical compound undergoes changes in wavelength and energy due to interaction with the molecules. This discovery laid the foundation for Raman Spectroscopy, a vital analytical tool used globally in chemistry, physics, medicine, and materials science to identify molecular structures. Raman's contributions extended beyond his personal research; as the director of the Indian Institute of Science (IISc) in Bangalore and founder of the Indian Academy of Sciences, he played a central role in establishing India's modern scientific infrastructure and mentoring generations of Indian physicists.`,
        
        "abdul kalam": `Dr. A. P. J. Abdul Kalam, popularly known as the 'People's President' and the 'Missile Man of India,' was a towering figure in modern Indian science and technology who played a pivotal role in establishing India's space and nuclear capabilities. As a rocket scientist at the Indian Space Research Organisation (ISRO), Kalam was the project director of India's first indigenous Satellite Launch Vehicle (SLV-III), which successfully deployed the Rohini satellite in orbit in 1980. He later transitioned to the Defence Research and Development Organisation (DRDO), where he led the Integrated Guided Missile Development Programme (IGMDP), successfully developing strategic missiles like Agni and Prithvi. Dr. Kalam was also the chief scientific adviser to the Prime Minister and played a critical role in the Pokhran-II nuclear tests of 1998, establishing India's status as a nuclear-capable nation. His vision for India, outlined in his book 'India 2020,' advocated for leveraging science and technology for rural development, education, and economic growth, inspiring millions of young students to pursue scientific careers.`,
        
        "modern science and technology": `The development of modern science and technology in India after independence in 1947 was guided by a vision to achieve self-reliance and address socioeconomic challenges through scientific planning. Under the leadership of Prime Minister Jawaharlal Nehru and visionary scientists like Homi Bhabha, Vikram Sarabhai, and Shanti Swarup Bhatnagar, India established a network of premier institutions, including the Indian Institutes of Technology (IITs), the Council of Scientific and Industrial Research (CSIR), the Department of Atomic Energy (DAE), and the Indian Space Research Organisation (ISRO). These institutions drove major national transformations. The Green Revolution of the 1960s, powered by agricultural science, achieved food security. The space program made India a global leader in satellite launch technology, producing cost-effective planetary missions like Chandrayaan (lunar probe) and Mangalyaan (Mars Orbiter). In recent decades, India's information technology revolution, pharmaceutical manufacturing, and digital infrastructure (like UPI) have demonstrated how scientific planning can drive global innovation and domestic development.`,
        
        "bridges the gap": `Modern Indian science bridges the gap between ancient traditions and present-day innovations by honoring historical knowledge systems while applying rigorous modern scientific methodologies. Ancient India made pioneering contributions to mathematics (the concept of zero, decimal system, Aryabhata's astronomy), medicine (Sushruta's surgical techniques, Charaka's Ayurveda), and metallurgy (the rust-resistant Iron Pillar of Delhi). Modern Indian scientists have consistently sought to understand, validate, and build upon this heritage. For example, contemporary research in pharmacology utilizes modern chemical analysis to isolate active compounds from traditional Ayurvedic herbs, leading to evidence-based natural medicines. In agriculture, ancient organic farming practices are combined with modern soil biotechnology to promote sustainable farming. In weather forecasting, traditional monsoon tracking is integrated with supercomputing models. This unique synthesis allows India to preserve its civilizational identity while actively participating in high-technology fields like quantum computing, space exploration, and artificial intelligence, showing that tradition and innovation are complementary.`,
        
        "physics, space research": `The progress of modern India has been deeply shaped by strategic advancements in physics, space research, and nuclear science, driving technological sovereignty and economic growth. Space research, led by ISRO, has transformed daily life in India through satellite systems that support telecommunications, weather forecasting, disaster warning, and satellite-guided agriculture. Missions like the Chandrayaan series (which discovered water molecules on the Moon) and the Mars Orbiter Mission showcase India's capacity for high-end, low-cost space engineering. In the nuclear sector, India has developed a unique three-stage nuclear power program, spearheaded by Homi Bhabha, designed to utilize the country's vast thorium reserves for clean, peaceful energy generation. Advancements in physics have also driven innovations in telecommunications, defense systems, and medical diagnostics. By investing in these frontier sciences, India has not only established itself as a global technological power but has also created high-value industries, created jobs, and secured its critical national infrastructure.`,
        
        "traditional indian crafts": `Traditional Indian crafts are reflections of the country's diverse cultural heritage and artistic expression, representing centuries-old techniques passed down through generations of artisan families. Pottery, the oldest craft, ranges from simple utilitarian clay vessels to the polished black pottery of Manipur and the glazed Blue Pottery of Jaipur, showcasing a mastery of soil and temperature control. Woodcraft, practiced across India, is exemplified by the delicate walnut wood carvings of Kashmir, the sandalwood carvings of Karnataka, and the vibrant wooden toys of Kondapalli, blending utility with mythological storytelling. Bidriware is a highly specialized metal inlay craft originating from Bidar, Karnataka. It involves engraving intricate designs on an alloy of zinc and copper, blackened with soil containing ammonium chloride, and inlaying it with pure silver wire. These crafts are not mere decorative items; they represent the economic livelihood of millions of rural artisans, preserve traditional community identities, and showcase India's unique design vocabulary on the global stage.`,
        
        "handloom traditions": `The handloom traditions of India represent a rich textile heritage characterized by diverse weaving techniques, localized fibers, and distinct patterns that define regional identities. Banarasi silk, from Varanasi, is renowned for its gold and silver brocade (zari) work, featuring Persian-inspired floral motifs woven on fine silk. Pashmina, from Kashmir, is spun from the fine underwool of Himalayan goats, producing shawls of extraordinary warmth and softness, often decorated with hand-embroidered paisley patterns. Kanchipuram saris, from Tamil Nadu, are characterized by heavy silk and wide contrast borders, where the body and border are woven separately and joined using a specialized 'pit loom' lock system. Paithani saris, from Maharashtra, feature silk bodies with oblique square designs on the borders and pallu, hand-woven with fine gold thread and showing motifs like peacocks. These handloom traditions are not only sustainable fashion symbols but are protected under Geographical Indications (GI) to preserve the livelihoods of traditional weavers against mass industrial imitation.`,
        
        "folk art": `Folk art forms in India have historically played a vital role in preserving the country's cultural heritage, acting as visual narratives of oral folklore, religious devotion, and daily community life. Madhubani art, originating from the Mithila region of Bihar, was traditionally painted by women on the mud walls of houses during festivals, featuring bold geometric patterns and depictions of nature and deities using natural dyes. Warli art, from the tribal communities of Maharashtra, utilizes a simple graphic vocabulary of circles, triangles, and squares to depict daily activities like hunting, dancing, and harvesting, painted on clay walls using white rice paste. Kalamkari, from Andhra Pradesh, is a hand-painted or block-printed cotton textile art using natural vegetable dyes, illustrating scenes from the Ramayana and Mahabharata. These folk arts are critical repositories of community memory, preserving historical events and social values without formal academic scripts, and have adapted to modern media like canvas and paper to find global markets.`,
        
        "stone carvings": `Stone carving has been a cornerstone of the Indian artistic tradition for over two millennia, creating some of the world's most spectacular rock-cut monuments and structural sculptures. Guided by the principles of the 'Shilpa Shastras' (ancient design manuals), Indian stone carvers developed a profound understanding of rock geology, chisel mechanics, and structural balance. This mastery is visible in the monolithic temples of Ellora (the Kailash temple, carved top-down out of a single mountain), the relief sculptures of Mahabalipuram, and the detailed brackets of Khajuraho and Belur temples. Carvers used stone to capture complex emotions, movements, and philosophical concepts, transforming hard granite, sandstone, and soft soapstone into delicate ornaments. The stone carving tradition was sustained by lineage-based guilds (shrenis) that passed secrets of measurements and carving techniques from father to son. Today, this heritage is preserved by active artisan communities, maintaining the restoration of historic monuments and the continuation of sacred and secular stone sculptures.`,
        
        "cultural identity?": `Traditional Indian crafts and folk arts are central to the preservation and promotion of India's cultural identity, serving as symbols of the nation's historical continuity and soft power. In an era of global standardization, these unique handmade products celebrate localized heritage and individual creativity. For example, when a Banarasi sari or a Madhubani painting is recognized globally, it promotes a positive image of India's artistic depth and rich traditions. Furthermore, these crafts support rural economies, preventing migration to cities by providing sustainable livelihood options for rural artisans and women. The protection of these arts through Geographical Indications (GI) tags ensures their quality and authenticity. By integrating traditional motifs into modern fashion and interior design, and showcasing them in international exhibitions and tourism festivals, India successfully bridges its historic legacy with contemporary global markets, ensuring that its cultural identity remains active, respected, and economically viable.`,
        
        "holistic healthcare": `The concept of holistic healthcare in India is defined by a comprehensive approach to health that integrates physical, mental, and spiritual well-being, rather than merely treating physical symptoms. This approach is codified in the traditional AYUSH systems: Ayurveda, Yoga, Siddha, and Unani. Ayurveda, meaning the 'science of life,' focuses on maintaining balance between three bodily humors or Doshas (Vata, Pitta, and Kapha) through diet, herbal remedies, and lifestyle. Siddha, popular in South India, emphasizes purification of the body and mind using mineral and herbal preparations. Unani, derived from ancient Greek and Arab systems, focuses on balancing the four humors of the body using natural substances. Yoga provides a structured system of physical postures (asanas), breathing control (pranayama), and meditation to unite the body and mind. Together, these systems emphasize preventive healthcare, boosting the body's natural immunity, and adopting a balanced lifestyle in harmony with nature, contributing significantly to global wellness and preventive medicine.`,
        
        "ashtanga yoga": `Ashtanga Yoga, as compiled by the sage Patanjali in the Yoga Sutras, is an eight-limbed path of spiritual and physical discipline designed to achieve mental clarity, physical health, and self-realization. The eight limbs are: 1. Yamas (moral restraints, including non-violence and truthfulness), 2. Niyamas (personal observances, including cleanliness and contentment), 3. Asanas (physical postures to build strength and flexibility), 4. Pranayama (breath control to regulate life energy), 5. Pratyahara (withdrawal of senses from external distractions), 6. Dharana (focused concentration), 7. Dhyana (continuous meditation), and 8. Samadhi (union with the self or super-consciousness). In modern healthcare, Ashtanga Yoga is recognized as a powerful tool for preventive medicine and stress management. The physical postures improve cardiovascular health, muscular strength, and posture, while pranayama regulates the autonomic nervous system, reducing heart rate and cortisol levels. Pratyahara and dhyana calm the mind, helping reduce anxiety, depression, and improve overall psychological resilience.`,
        
        "cultural diversity": `Cultural diversity in India is a unique civilizational phenomenon where a multitude of languages, customs, cuisines, clothing, and religious beliefs coexist to form a unified national fabric, summarized by the phrase 'Unity in Diversity.' India is home to hundreds of languages, with 22 officially recognized in the Eighth Schedule of the Constitution, representing diverse linguistic families. Clothing styles, such as the sari, dhoti, and kurta, are draped differently in each region, utilizing local handloom traditions. Food habits vary from the rice and fish-based diets of coastal regions to the wheat and dairy-rich cuisines of the North, utilizing localized spices and cooking techniques. Despite these differences, a shared history, common philosophical values, and mutual tolerance bind the country together. This diversity acts as a mosaic rather than a melting pot, where each regional culture retains its unique identity while contributing to the beauty of the overall national image, making India a global example of peaceful pluralistic coexistence.`,
        
        "preserving indian": `Preserving Indian cultural heritage is essential for maintaining the country's civilizational identity and supporting sustainable development. India's vast heritage includes both tangible monuments (temples, forts, caves) and intangible expressions (folk music, crafts, traditional healthcare). Organizations like UNESCO play a critical role by designating World Heritage Sites, which attracts global tourism and funding. At the national level, the Archaeological Survey of India (ASI) is responsible for the physical conservation of monuments. Educational institutions promote heritage awareness by integrating local history into the curriculum, while non-governmental organizations and local communities organize heritage walks and support traditional artisan guilds. Protecting this heritage is not just about looking at the past; it ensures that traditional knowledge systems (such as water harvesting and sustainable crafts) are utilized for modern ecological challenges and that the economic benefits of heritage tourism support local communities.`,
        
        "healthcare systems": `Traditional healthcare systems and cultural heritage together contribute to the promotion of India's identity and global recognition by presenting a holistic model of sustainable living to the world. In recent years, India's soft power has been significantly enhanced by global interest in Yoga and Ayurveda, culminating in the establishment of the International Day of Yoga by the United Nations, celebrated by millions worldwide. This global recognition highlights the relevance of Indian wellness concepts for modern lifestyle diseases and stress management. Concurrently, India's diverse cultural heritage—including its classical dances, traditional music, handloom fabrics, and historical monuments—attracts millions of wellness tourists and researchers. By promoting AYUSH systems alongside heritage conservation, India offers an integrated approach to physical health, mental peace, and cultural richness, establishing itself as a global hub for holistic wellness, spiritual tourism, and sustainable lifestyle practices that respect both human health and nature.`
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
            matchedText = `This assignment analysis evaluates ${question.replace(/[?.]/g, '')} within the curriculum of ${subject}. The topic represents a crucial milestone in our academic understanding of the field, highlighting the structural, theoretical, and practical applications of this knowledge. By analyzing the core mechanisms involved, we can appreciate the design considerations and methodologies that govern the system. For instance, when implementing these concepts, it is essential to consider the trade-offs between efficiency and reliability, which are key priorities in the industry today. Furthermore, the practical applications of this theory extend beyond the classroom, influencing how real-world problems are addressed by professionals and engineers. Through rigorous study and peer collaboration, we can synthesize these academic principles with industrial standards, preparing us to tackle complex challenges and contribute to future innovations.`;
        }
        
        // Pad the text with extra sentences to meet the 380/460 word target
        const targetWordCount = (subject.includes("Heritage") || subject.includes("Culture")) ? 460 : 380;
        const fillerPool = [
            `Additionally, a detailed study of ${question.replace(/[?.]/g, '')} reveals that the theoretical principles are highly aligned with modern system constraints. `,
            `We must also take into account the historical development of ${subject} as a discipline to understand how these standards were established. `,
            `The structural integrity of this approach has been validated through multiple case studies and industrial deployments. `,
            `From a student perspective, understanding these parameters is crucial for building a strong foundation in the course. `,
            `The lecture sessions provided several diagrams and visual aids that helped clarify these complex relationships. `,
            `By examining the boundary conditions of this topic, we gain insights into potential optimization bottlenecks. `,
            `In a professional setting, mastering these concepts helps reduce system downtime and optimizes resource allocation. `,
            `I intend to explore this topic further in the laboratory sessions to verify the theoretical calculations hands-on. `,
            `Understanding the limitations and edge cases of this methodology is just as critical as knowing its strengths. `,
            `The collaborative discussions with classmates during the session helped clear up some initial misconceptions. `
        ];
        
        let words = matchedText.split(/\s+/);
        let fillerIdx = 0;
        
        while (words.length < targetWordCount && fillerIdx < fillerPool.length) {
            matchedText += " " + fillerPool[fillerIdx];
            words = matchedText.split(/\s+/);
            fillerIdx++;
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

        // 📝 DYNAMIC BULLET POINT INJECTOR (Random 2-4 points)
        let bulletSection = "";
        if (Math.random() > 0.5) { 
            const points = [
                `Developing a deeper grasp of ${topic} mechanics.`,
                `Identifying the synergy between ${topic} and ${subject}.`,
                `Applying optimized logic to real-world ${subject} cases.`,
                `Evaluating the long-term impact of ${topic} on the field.`,
                `Streamlining workflows using ${topic} best practices.`,
                `Understanding the core architecture of ${topic} systems.`,
                `Analyzing efficiency gains through ${topic} implementation.`,
                `Collaborating with peers to solve ${subject} challenges.`
            ];
            const count = Math.floor(Math.random() * 3) + 2;
            const selected = shuffle(points).slice(0, count);
            bulletSection = "\n\nKey Insights & Takeaways:\n" + selected.map(p => "• " + p).join("\n") + "\n\n";
        }

        let text = r(pool.intros) + r(pool.bodies) + r(conclusions);

        // 📝 NATURAL BULLET POINT INJECTOR (Weighted & Varied)
        const weights = { LEARN: 0.7, APP: 0.7, EXP: 0.4, FEEL: 0.2, CONC: 0.1 };
        const threshold = weights[tag] || 0.4;

        if (Math.random() < threshold) { 
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
            
            const headers = ["Key Takeaways:", "Core Concepts:", "Technical Observations:", "Practical Insights:", "My Notes:", ""];
            const header = r(headers);
            const bulletStyles = ["• ", "– ", "  - ", "➤ "];
            const style = r(bulletStyles);
            
            const bulletText = (header ? `\n\n${header}\n` : "\n\n") + selected.map(p => style + p).join("\n") + "\n\n";
            
            if (Math.random() > 0.8) {
                text = bulletText + text;
            } else {
                text += bulletText;
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
            `The sheer versatility of ${subject} is something that continues to impress me. `,
            `I took careful notes on the specific implementation details for ${topic} shared today. `,
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
        while(text.split(/\s+/).length < 425 && extraIdx < extraPool.length) {
            text += extraPool[extraIdx];
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
                        let assignmentText = "";
                        let qNum = 1;

                        for (const question of questions) {
                            aiFillBtn.innerHTML = `<span>✨ Generating Answer ${qNum}/${questions.length}...</span>`;
                            let retries = 5;
                            let success = false;
                            let lastError = "";

                            while (retries > 0 && !success) {
                                try {
                                    const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            subject,
                                            topic: question,
                                            sectionTag: "ASSIGNMENT",
                                            moduleRoman: moduleNum,
                                            syllabus: question,
                                            styleInstruction: ""
                                        })
                                    });

                                    const data = await res.json();
                                    if (!res.ok) {
                                        if (data.retryAfter) {
                                            throw new Error(`RATELIMIT:${data.retryAfter}:${data.error}`);
                                        }
                                        throw new Error(data.error || `Failed to generate answer for Question ${qNum}`);
                                    }

                                    assignmentText += `Question ${qNum}: ${question}\n\nAnswer:\n${data.text}\n\n\n`;
                                    success = true;
                                    await new Promise(r => setTimeout(r, 1000));
                                } catch (err) {
                                    lastError = err.message;
                                    if (lastError.startsWith("RATELIMIT:")) {
                                        aiErrorMsg.innerHTML = `❌ <b>Limit Hit:</b> ${lastError.split(":")[2]}. <br> Wait for the timer.`;
                                        aiErrorMsg.classList.remove('hidden');
                                        startCooldownTimer(parseInt(lastError.split(":")[1]));
                                        return;
                                    }
                                    retries--;
                                    if (retries > 0) {
                                        aiFillBtn.innerHTML = `<span>⚠️ Retrying Answer ${qNum} (${retries})...</span>`;
                                        await new Promise(r => setTimeout(r, 2000));
                                    }
                                }
                            }

                            if (!success) {
                                console.warn(`Backend failed for Question ${qNum}. Using client fallback.`);
                                const fallbackAns = getClientAssignmentFallback(subject, moduleNum, question, qNum);
                                assignmentText += `Question ${qNum}: ${question}\n\nAnswer:\n${fallbackAns}\n\n\n`;
                            }

                            qNum++;
                        }

                        const textarea = document.getElementById('assignmentAnswers');
                        textarea.value = assignmentText.trim();
                        textarea.dispatchEvent(new Event('input'));

                        aiFillBtn.innerHTML = `<span>✅ Assignment Generated!</span>`;
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
                    aiFillBtn.innerHTML = `<span>✨ Generating Content...</span>`;
                    aiSpinner.classList.remove('hidden');

                    // SEQUENTIAL GENERATION WITH AUTO-WAKEUP
                    for (const sec of sections) {
                        aiFillBtn.innerHTML = `<span>✨ Generating ${sec.name}...</span>`;
                        let retries = 5; // Extra retries per section to wait for server wake-up
                        let success = false;
                        let lastError = "";

                        while (retries > 0 && !success) {
                            try {
                                const res = await fetch(`${API_BASE_URL}/api/generate-section`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
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

            const isTerm4 = yearSel.value === "I" && termSel.value === "4";
            const data = {
                name: document.getElementById('studentName').value,
                reg: document.getElementById('regNumber').value,
                sec: document.getElementById('classSection').value,
                yt: `Year ${yearSel.value} - Term ${termSel.value}`,
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
                    [{ content: 'Name of the Assessment', styles: { fontStyle: 'bold', cellWidth: 60 } }, { content: `${isTerm4 ? "Assignment" : "Reflective Journal"} - ${data.assNum}` }],
                    [{ content: 'Date of Submission', styles: { fontStyle: 'bold' } }, { content: data.date }]
                ],
            });

            // Center Title
            let currentY = doc.lastAutoTable.finalY + 15;
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text(`${isTerm4 ? "Assignment" : "Reflective Journal"} - ${data.assNum}`, pageWidth/2, currentY, { align: "center" });
            
            // Table 3: Topic Header
            currentY += 8;
            doc.autoTable({
                startY: currentY,
                margin: { top: 45 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
                body: [
                    [{ content: 'Date', styles: { fontStyle: 'normal', textColor: [192, 0, 0], cellWidth: 40 } }, { content: data.date }],
                    [{ content: `${isTerm4 ? "Assignment" : "Journal Entry"}\nTopic`, styles: { fontStyle: 'normal', textColor: [192, 0, 0] } }, { content: data.topic }]
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

            if (isTerm4) {
                drawContentSection('Assignment\nAnswers', data.assignmentAnswers, doc.lastAutoTable.finalY);
            } else {
                drawContentSection('1. Experience\n(Class Content)', data.exp, doc.lastAutoTable.finalY);
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
            const docType = isTerm4 ? "Assignment" : "ReflectiveJournal";
            const cleanFilename = `${safeName}_${safeReg}_${docType}_${safeSub}-${moduleRoman}`;
            doc.save(`${cleanFilename}.pdf`);
            incrementJournalCounter();

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
                if (words >= 450) {
                    badge.className = "text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-600 font-bold";
                } else if (words >= 350) {
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

    // Initialize UI on load
    updateUI();
    initJournalCounter();
});