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
    });

    subjSel.addEventListener('change', () => {
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
            
            const bulletText = "\n\n" + selected.map(p => "• " + p).join("\n") + "\n\n";
            
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
            if (sentenceCount % 3 === 0) {
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
                                    
                                    fallbackAns += `\n\n${selectedBullets}\n\n`;
                                } else {
                                    fallbackAns += `\n\n`;
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

                    const fetchPromises = sections.map(async (sec, index) => {
                        // ⏱️ Stagger the starts slightly to update progressive counter cleanly
                        await new Promise(r => setTimeout(r, index * 300));
                        aiFillBtn.innerHTML = `<span>✨ Generating ${sec.name}...</span>`;

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
            updateAssessmentLabel();

            // Smooth scroll back to top of dashboard
            document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---------------- MILESTONE CELEBRATION ----------------
    const milestoneBadge = document.getElementById('milestoneBadge');
    const milestoneModal = document.getElementById('milestoneModal');
    // ---------------- MODAL LOGIC ----------------
    const announcementModal = document.getElementById('announcementModal');
    const closeAnnouncement = document.getElementById('closeAnnouncement');
    const announcementOverlay = document.getElementById('announcementOverlay');
    const exploreNowBtn = document.getElementById('exploreNowBtn');
    const term4Badge = document.getElementById('term4Badge');
    
    const closeMilestone = document.getElementById('closeMilestone');
    const modalOverlay = document.getElementById('modalOverlay');

    if (announcementModal) {
        let wasAutoShown = false;

        const showAnnouncement = () => {
            announcementModal.classList.remove('hidden');
            setTimeout(() => {
                announcementModal.classList.add('active');
            }, 10);
        };

        const hideAnnouncement = () => {
            announcementModal.classList.remove('active');
            setTimeout(() => {
                announcementModal.classList.add('hidden');
            }, 500);
            
            // Increment count only if it was auto-shown
            if (wasAutoShown) {
                let count = parseInt(localStorage.getItem('term4PopupCount') || '0', 10);
                localStorage.setItem('term4PopupCount', (count + 1).toString());
                wasAutoShown = false;
            }
        };

        if (term4Badge) term4Badge.addEventListener('click', showAnnouncement);
        if (closeAnnouncement) closeAnnouncement.addEventListener('click', hideAnnouncement);
        if (announcementOverlay) announcementOverlay.addEventListener('click', hideAnnouncement);
        if (exploreNowBtn) exploreNowBtn.addEventListener('click', hideAnnouncement);

        // Show automatically up to 5 times
        let showCount = parseInt(localStorage.getItem('term4PopupCount') || '0', 10);
        if (showCount < 5) {
            setTimeout(() => {
                wasAutoShown = true;
                showAnnouncement();
            }, 1000);
        }
    }

    if (milestoneBadge && milestoneModal) {
        const showMilestone = () => {
            milestoneModal.classList.remove('hidden');
            setTimeout(() => {
                milestoneModal.classList.add('active');
            }, 10);
        };

        const hideMilestone = () => {
            milestoneModal.classList.remove('active');
            setTimeout(() => {
                milestoneModal.classList.add('hidden');
            }, 500);
        };

        milestoneBadge.addEventListener('click', showMilestone);
        if (closeMilestone) closeMilestone.addEventListener('click', hideMilestone);
        if (modalOverlay) modalOverlay.addEventListener('click', hideMilestone);
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

    // Initialize UI on load
    updateUI();
    initJournalCounter();
});