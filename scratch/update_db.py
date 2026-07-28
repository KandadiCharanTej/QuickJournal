import json
import re

new_db = {
    "ecosystem": "So basically, an ecosystem is like a community where living things and non-living things interact. It has two main parts:\n- Biotic: The living stuff like plants (producers), animals (consumers), and fungi (decomposers).\n- Abiotic: The non-living stuff like sunlight, water, and soil.\nThe whole point of an ecosystem is to keep energy flowing and recycle nutrients so everything stays in balance.",
    
    "ecological balance": "Ecological balance is pretty much when everything in an environment is stable. The species, resources, and habitats are all in a state of equilibrium. It's super important because:\n- It keeps the food chain working smoothly.\n- It prevents any one species from overpopulating and ruining resources.\nWhen we do things like deforestation or pollution, it messes up this balance, which can lead to species dying out and major climate issues.",
    
    "food chain": "A food chain is just the path of energy transfer when one organism eats another. A classic example is:\n- Grass gets energy from the sun (Producer).\n- A grasshopper eats the grass (Primary consumer).\n- A frog eats the grasshopper (Secondary consumer).\n- A snake eats the frog, and a hawk eats the snake.\nThe catch is that only about 10% of the energy moves to the next level, so the animals at the top get way less energy.",
    
    "trophic levels": "Trophic levels are basically the steps in a food chain that show how organisms get their energy. \n- 1st Level: Producers (like plants) that make their own food.\n- 2nd Level: Primary consumers (herbivores) that eat the plants.\n- 3rd & 4th Levels: Secondary and tertiary consumers (carnivores) that eat other animals.\nBecause a lot of energy is lost as heat at each step (the 10% rule), there are usually only 4 or 5 levels in total.",
    
    "ecological pyramids": "Ecological pyramids are just graphs that show the relationship between different trophic levels. There are three main types:\n- Pyramid of Numbers: Shows how many individual organisms are at each level.\n- Pyramid of Biomass: Shows the total dry weight of organisms.\n- Pyramid of Energy: Shows how much energy flows through each level.\nWhile numbers and biomass pyramids can sometimes be inverted (like a single tree supporting lots of bugs), the energy pyramid is always upright.",
    
    "pyramid of energy": "The pyramid of energy is a graph showing how energy flows through a food chain over time. The most important thing about it is that it's ALWAYS upright. \nThis is because of the laws of thermodynamics: every time an animal eats something, about 90% of the energy is lost as heat or used for basic survival, and only 10% is passed on to the next level. So, producers at the bottom always have the most energy.",
    
    "carbon cycle": "The carbon cycle is how carbon moves around the Earth. It's super important for life. \n- Plants absorb CO2 from the air for photosynthesis.\n- Animals eat the plants, and then breathe out CO2 (respiration).\n- When plants and animals die, decomposers break them down, releasing carbon back into the soil and air.\nOver millions of years, some carbon turns into fossil fuels. Burning these fuels is what's messing up the cycle right now and causing global warming.",
    
    "nitrogen cycle": "The nitrogen cycle is how nitrogen gets converted into usable forms for living things. Even though the air is 78% nitrogen, we can't use it directly. \n- Nitrogen Fixation: Bacteria in the soil turn nitrogen gas into ammonia.\n- Nitrification: Other bacteria turn ammonia into nitrates, which plants can absorb.\n- Assimilation: Plants and animals use the nitrates to build proteins.\n- Denitrification: Finally, bacteria break down waste and release nitrogen gas back into the air.",
    
    "greenhouse effect": "The greenhouse effect is basically how the Earth traps the sun's heat. \n- Sunlight comes in and warms the surface.\n- The Earth radiates heat back out.\n- Greenhouse gases in the atmosphere (like CO2, methane, and water vapor) trap some of this heat, keeping the planet warm.\nNaturally, this is a good thing because it keeps us from freezing. But human activities like burning fossil fuels are trapping too much heat, causing climate change.",
    
    "ozone layer depletion": "Ozone layer depletion is the thinning of the Earth's ozone layer, which sits up in the stratosphere and blocks harmful UV rays from the sun.\nIt's mainly caused by chemicals called CFCs (chlorofluorocarbons) that used to be in old fridges and aerosol sprays. When CFCs reach the atmosphere, UV light breaks them down, releasing chlorine that destroys ozone molecules. Luckily, after we banned CFCs, the ozone hole has actually started to heal!",
    
    "air pollution, its sources": "Air pollution is when harmful stuff gets into the air and messes with human health and the environment. \n- Anthropogenic (human-made) sources: Exhaust from cars, smoke from factories, burning fossil fuels, and agricultural chemicals.\n- Natural sources: Volcanic eruptions, forest fires, and dust storms.\nBreathing this polluted air causes major respiratory issues, heart disease, and contributes to bigger problems like acid rain.",
    
    "air pollution control devices": "These are technologies used in factories and cars to clean up emissions before they hit the air. Some common ones include:\n- Electrostatic Precipitators: Use static electricity to trap dust and smoke particles.\n- Fabric Filters (Baghouses): Basically act like giant vacuum bags to catch dust.\n- Wet Scrubbers: Use liquid sprays to wash pollutants out of the gas.\n- Catalytic Converters: Used in cars to turn toxic gases into harmless water vapor and CO2.",
    
    "noise pollution": "Noise pollution is basically just excessive or disturbing sound that messes with our well-being. It becomes harmful when it crosses around 75-80 decibels.\n- Sources: Traffic, construction, loud speakers, and industrial machines.\n- Effects: It can cause hearing loss, sleep disruption, stress, and even high blood pressure. It also really messes up wildlife by interfering with their communication and driving them away from their habitats.",
    
    "noise measured": "Noise is measured in decibels (dB) using a Sound Level Meter. Prevention and control usually happen in three ways:\n- At the source: Lubricating machines or using silencers.\n- In the transmission path: Building sound barriers, planting dense trees, or using double-glazed windows to block the sound.\n- At the receiver: Making workers wear earplugs or earmuffs in loud areas.",
    
    "noise pollution rules": "In India, noise pollution is regulated under the Environment Protection Act. The rules set specific decibel limits depending on the zone and time of day:\n- Industrial zones: 75 dB (day), 70 dB (night)\n- Commercial: 65 dB (day), 55 dB (night)\n- Residential: 55 dB (day), 45 dB (night)\nThey also define strict 'Silence Zones' around hospitals and schools where loud noises and honking are totally banned.",
    
    "water pollution": "Water pollution is when water bodies get contaminated, making the water unsafe. \n- Point source: Pollution coming from one specific place, like a factory pipe dumping waste.\n- Non-point source: Runoff from city streets or farm fields carrying fertilizers.\nThe pollutants can be chemicals, sewage, or heavy metals. It causes diseases, ruins aquatic ecosystems, and leads to eutrophication (where algae blooms steal all the oxygen in the water).",
    
    "surface water": "Surface water pollution affects rivers and lakes, usually from sewage, factory waste, and farm runoff. It spreads fast but can sometimes be cleaned naturally through aeration. \nGroundwater pollution happens when chemicals (like pesticides or leaking underground tanks) seep into the soil and reach the aquifers below. Groundwater moves super slowly and has no sunlight, so once it's polluted, it's incredibly difficult and expensive to clean up.",
    
    "water quality parameters": "We use several parameters to check if water is safe:\n- pH: Measures acidity (6.5 to 8.5 is normal).\n- Turbidity: How cloudy the water is from suspended dirt.\n- Total Suspended Solids (TSS): Solid particles that block sunlight in the water.\n- BOD (Biochemical Oxygen Demand): Measures how much oxygen bacteria need to break down organic waste. High BOD means high pollution.\n- COD: Measures total organic chemicals present.",
    
    "stages of wastewater treatment": "Wastewater treatment cleans up sewage before releasing it back into nature. It happens in three main stages:\n- Preliminary & Primary: Physical steps. Uses screens to catch large trash, and settling tanks where sludge sinks to the bottom.\n- Secondary: Biological step. Uses bacteria and air to consume and break down the dissolved organic waste.\n- Tertiary: Advanced chemical step. Filters the water, removes nutrients like phosphorus, and disinfects it using UV or chlorine.",
    
    "primary, secondary, and tertiary": "Here's the breakdown of the wastewater treatment phases:\n- Primary: Purely physical. It uses gravity and screens to separate floating trash and heavy sludge. Doesn't remove dissolved chemicals.\n- Secondary: Biological. Bacteria are added into aerated tanks to literally eat the dissolved organic matter and clean the water naturally.\n- Tertiary: The final polish. Uses advanced filtration and chemicals to remove remaining salts, nitrogen, and kills pathogens, making the water safe for reuse.",
    
    "soil pollution": "Soil pollution is when toxic chemicals contaminate the land, ruining agriculture and poisoning groundwater. \n- Causes: Overusing chemical fertilizers/pesticides, dumping industrial waste, and garbage landfills.\n- Effects: Heavy metals like lead and arsenic get absorbed by crops and eventually end up in our food, causing serious health issues.\n- Solutions: Switching to organic farming, proper waste disposal, and using plants/microbes to absorb toxins from the soil (bioremediation).",
    
    "solar energy": "Solar energy is just harnessing power from the sun, and it's our most abundant renewable resource.\n- How it works: Photovoltaic (PV) cells in solar panels convert sunlight directly into electricity.\n- Benefits: It’s completely carbon-free, reduces pollution, and lowers electricity bills.\n- Challenges: It only works when the sun is shining, so we need really good batteries to store the power for nighttime or cloudy days.",
    
    "biomass energy": "Biomass energy comes from organic waste like plants, cow dung, and sewage. It's carbon-neutral because the CO2 it releases was absorbed by the plants while they were growing.\nOne major way to use it is Biogas production: bacteria break down the waste in an oxygen-free tank (anaerobic digestion) to produce methane gas. We can use this gas for cooking or generating electricity, and the leftover sludge is an amazing organic fertilizer.",
    
    "wind energy": "Wind energy uses large turbines to convert the wind's kinetic energy into electricity. \n- How it works: The wind spins the aerodynamic blades, which turns a generator inside the turbine.\n- Benefits: It produces zero emissions and the land around the turbines can still be used for farming.\n- Challenges: Wind speeds are unpredictable, the turbines can be noisy, and they sometimes pose a hazard to local bird populations.",
    
    "hydrogen energy": "Hydrogen energy is a super clean fuel that only produces water vapor when burned or used in a fuel cell. \n- Green Hydrogen is the best kind, made by splitting water using renewable electricity.\n- In a fuel cell, hydrogen mixes with oxygen to create an electric current.\nIt’s a huge deal for the future of transportation (like trucks and ships) and heavy industry, but it's currently hard to store safely because it requires high pressure.",
    
    "tidal energy": "Tidal and ocean energy use the movement of the sea to generate power. \n- Tidal energy relies on the moon's gravity causing tides. We build underwater turbines or barrages (like dams) that spin as the tide goes in and out.\n- Ocean Thermal energy uses the temperature difference between warm surface water and cold deep water.\nIt's great because tides are 100% predictable, but the equipment is expensive to build and salt water is really corrosive.",
    
    "geothermal energy": "Geothermal energy taps into the natural heat trapped deep inside the Earth's core.\nWe drill deep wells to reach underground reservoirs of steam and hot water, which are then used to spin turbines and generate electricity. \nIt’s highly reliable because, unlike solar or wind, the Earth’s heat is constantly available 24/7. However, it can only be built in specific areas with high volcanic or tectonic activity.",
    
    "environmental benefits": "Switching to alternative energy (like solar, wind, and hydro) has massive environmental benefits:\n- It drastically cuts down greenhouse gas emissions, which is our best shot at stopping global warming.\n- It basically eliminates air pollution from burning coal, meaning less respiratory diseases.\n- It saves huge amounts of fresh water since wind and solar don't need water for cooling like traditional power plants do.",
    
    "e-waste management": "E-waste is discarded electronics like old phones and laptops. It’s highly toxic because it contains heavy metals like lead and mercury.\nWe manage it using the 3R principles:\n- Reduce: Build electronics that last longer and are easier to fix.\n- Reuse: Donate or refurbish old devices instead of throwing them away.\n- Recycle: Safely extract valuable metals (like gold and copper) from the circuit boards so we don't have to mine as much.",
    
    "environmental legislation": "Environmental legislation refers to the laws governments make to protect nature and control pollution. \nIn India, we have the Environment Protection Act, which gives the government power to regulate factory emissions and hazardous waste. \nGlobally, companies follow ISO 14000 standards, which act as a framework to help them reduce their carbon footprint, manage waste responsibly, and prove they are environmentally friendly.",
    
    "sanchi stupa": "The Sanchi Stupa in Madhya Pradesh is an amazing piece of ancient Buddhist architecture built by Emperor Ashoka. \n- Structure: It’s a huge stone dome that represents the universe, with umbrellas on top symbolizing the Buddha, Dharma, and Sangha.\n- Gateways (Toranas): The coolest part are the four carved stone gateways that tell stories of the Buddha’s past lives (Jataka tales) in incredible detail.",
    
    "ajanta caves": "The Ajanta Caves in Maharashtra are ancient rock-cut Buddhist monasteries carved straight into a cliffside.\nThey are world-famous for their mural paintings. The artists used a tempera technique on mud plaster to paint scenes from the Buddha's life. The art is super expressive and detailed, making it one of the finest surviving examples of classical Indian painting.",
    
    "konark sun temple": "The Konark Sun Temple in Odisha is an architectural masterpiece designed to look like a massive stone chariot for the Sun God, Surya. \n- It has 24 intricately carved wheels pulled by seven horses.\n- The engineering is mind-blowing: the wheels actually work as precise sundials that can tell the time down to the minute. \nIt's a perfect blend of ancient art, astronomy, and structural physics.",
    
    "taj mahal": "The Taj Mahal is pretty much the ultimate symbol of Indo-Islamic architecture, built by Emperor Shah Jahan for his wife Mumtaz Mahal.\nIt's famous for its absolute perfect symmetry and the pure white marble that changes color with the sunlight. The walls are decorated with 'pietra dura', which is a technique where semi-precious stones are inlaid into the marble to create beautiful floral patterns.",
    
    "mahabalipuram": "Mahabalipuram and the Red Fort show the two extremes of Indian engineering.\n- Mahabalipuram (ancient): Features incredible monolithic rock-cut temples carved out of single granite boulders right on the coast, showing early mastery of stone carving.\n- Red Fort (medieval): A massive red sandstone palace complex built by Shah Jahan, famous for its sophisticated defensive walls and an advanced water cooling system that ran through the palace.",
    
    "indian festivals": "Indian festivals are basically living museums that help preserve our cultural traditions. \nWhether it's Diwali, Holi, or Eid, these festivals bring communities together. They aren't just for fun—they pass down mythology, traditional food, and clothing to the younger generation. They also teach core values like charity and gratitude, while boosting local businesses and artisans.",
    
    "rituals and customs": "Rituals and customs are the glue that holds Indian society together. \nFrom birth to death, there are specific rites of passage (Sanskaras) that guide people through life. These customs encourage people to prioritize family, respect elders, and live in harmony with nature. Even as society modernizes, these traditions provide a sense of stability and connection to our ancestors.",
    
    "regional traditions": "Regional traditions are what make India so uniquely diverse. \nEvery state has its own language, dance, music, and food. For example, you have Bhangra in Punjab and Carnatic music in the South. Instead of dividing us, this diversity actually brings people together through cultural exchange, making India a vibrant mosaic rather than just a boring melting pot.",
    
    "seasonal festivals": "Seasonal festivals in India are deeply tied to agriculture and the changing of the seasons. \nFor example, harvest festivals like Makar Sankranti, Pongal, and Bihu celebrate the transition of the sun and the gathering of crops. People fly kites, light bonfires, and feast on the new harvest. They show how closely traditional Indian life is connected to nature's rhythms.",
    
    "unity, harmony": "Festivals in India are a huge driver for unity and social harmony. \nDuring major festivals, people from different religious backgrounds often come together, exchange sweets, and celebrate as a community. Traditions like the 'Langar' in Sikhism, where everyone sits and eats together regardless of their background, perfectly show how our culture promotes equality and mutual respect.",
    
    "c. v. raman": "Sir C. V. Raman was a legendary Indian physicist who put India on the global science map. \nHe won the Nobel Prize in Physics in 1930 for discovering the 'Raman Effect', which is basically how light scatters and changes energy when it passes through a transparent material. This discovery is still widely used today in chemistry and medicine to figure out the molecular structure of materials.",
    
    "abdul kalam": "Dr. A. P. J. Abdul Kalam, known as the 'Missile Man of India', was a brilliant scientist and one of our most beloved Presidents. \nHe played a massive role in building India's space program at ISRO and developed our strategic missile systems at DRDO. Beyond his scientific genius, he constantly inspired students to dream big and use technology to develop the country.",
    
    "modern science": "After independence, India focused heavily on modern science to build a self-reliant nation. \nLeaders set up premier institutes like the IITs and ISRO. This led to massive successes like the Green Revolution (which solved food shortages), our booming IT sector, and incredible space missions like Chandrayaan and Mangalyaan, showing the world that India is a serious technological powerhouse.",
    
    "bridges the gap": "Modern Indian science does a great job of bridging the gap between our ancient traditions and new innovations. \nWe don't just throw away old knowledge. For example, researchers use modern chemistry to study ancient Ayurvedic herbs, creating evidence-based medicines. We also combine traditional organic farming techniques with modern biotechnology, proving that tradition and innovation can work hand-in-hand.",
    
    "physics, space research": "Physics, space research, and nuclear science have completely transformed modern India. \n- ISRO's satellite networks are crucial for our telecommunications, weather forecasting, and disaster management.\n- Our nuclear program, started by Homi Bhabha, is working on using our vast thorium reserves to generate clean energy.\nInvesting in these frontier sciences has driven economic growth and secured our national infrastructure.",
    
    "traditional indian crafts": "Traditional Indian crafts are amazing reflections of our heritage, with skills passed down for generations. \n- Pottery: Ranges from simple clay pots to the beautiful glazed Blue Pottery of Jaipur.\n- Woodcraft: Includes delicate walnut carvings from Kashmir.\n- Bidriware: A cool metalcraft from Karnataka where pure silver wire is inlaid into blackened metal.\nThese crafts are crucial because they provide livelihoods for millions of rural artisans.",
    
    "handloom traditions": "India’s handloom textiles are world-famous for their quality and intricate designs. \n- Banarasi Silk: Known for its heavy gold and silver brocade work.\n- Pashmina: Super soft and warm shawls made from Himalayan goat wool.\n- Kanchipuram: South Indian saris famous for their heavy silk and contrasting borders.\nThese aren't just clothes; they represent regional identities and are protected by Geographical Indications (GI) tags.",
    
    "folk art": "Folk art in India is how communities recorded their stories and beliefs before formal writing was common. \n- Madhubani: Colorful, nature-inspired art painted on mud walls in Bihar.\n- Warli: Tribal art from Maharashtra that uses simple geometric white shapes on brown clay to show daily life.\n- Kalamkari: Hand-painted textiles using natural vegetable dyes.\nThese arts preserve our oral folklore and community memories beautifully.",
    
    "stone carvings": "Stone carving is an ancient Indian art form where craftsmen turned solid rocks into stunning sculptures and temples. \nUsing ancient design manuals (Shilpa Shastras), they mastered how to cut and balance stone. You can see this mastery in places like Ellora, Khajuraho, and Mahabalipuram, where hard granite was carved with incredible emotional depth and delicate details.",
    
    "cultural identity": "Traditional crafts and folk arts are a huge part of India's cultural identity and soft power. \nIn a world where everything is mass-produced in factories, our handmade goods celebrate individual creativity and regional heritage. When these crafts are showcased globally, it builds respect for Indian culture and provides sustainable jobs for rural communities, keeping the traditions alive.",
    
    "holistic healthcare": "Holistic healthcare in India doesn't just look at physical symptoms; it treats the mind, body, and spirit together. \nThis is the core of systems like Ayurveda, Yoga, Siddha, and Unani (AYUSH). For example, Ayurveda focuses on balancing the body's 'Doshas' through diet and herbs, while Yoga unites physical movement with mental focus. It’s all about preventive care and living in harmony with nature.",
    
    "ashtanga yoga": "Ashtanga Yoga is an eight-step path to physical and mental wellness, originally laid out by the sage Patanjali. \nIt includes moral restraints (Yamas), physical postures (Asanas) for strength, and breath control (Pranayama) to regulate stress. The final stages focus on deep meditation. Today, it’s widely recognized as an amazing way to manage anxiety, build resilience, and improve overall cardiovascular health.",
    
    "cultural diversity": "Cultural diversity in India is often described as 'Unity in Diversity'. \nWe have over 22 official languages, completely different clothing styles depending on the region, and hugely varied cuisines. Yet, despite all these differences, a shared history and mutual tolerance bind everyone together. It’s a beautiful mosaic where everyone keeps their unique identity while contributing to the whole nation.",
    
    "preserving indian": "Preserving India's cultural heritage is super important for keeping our identity alive. \nThis includes physical monuments and intangible things like folk music and traditional healthcare. Organizations like the ASI and UNESCO help protect these sites. It’s not just about looking at the past—heritage conservation brings in tourism revenue, creates jobs, and teaches us ancient sustainable practices that are still useful today.",
    
    "healthcare systems": "Traditional healthcare systems (like Yoga and Ayurveda) and our cultural heritage are massive boosters for India's global identity. \nBecause modern life is so stressful, the whole world is turning to Indian wellness concepts—like the International Day of Yoga, which is now celebrated globally. By combining our heritage tourism with wellness retreats, India has become a leading global hub for holistic health and sustainable living."
}

def replace_db_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the assignmentFallbackDb object definition
    pattern = r'(const assignmentFallbackDb = )\{[\s\S]*?\n\s*\};'
    
    # Format the new dictionary as a JS object
    new_db_str = "{\n"
    for k, v in new_db.items():
        # Escape backticks and backslashes for JS template literal
        v_escaped = v.replace('\\', '\\\\').replace('`', '\\`')
        new_db_str += f'        "{k}": `{v_escaped}`,\n'
    new_db_str = new_db_str.rstrip(',\n') + "\n    };"

    new_content = re.sub(pattern, r'\1' + new_db_str, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filepath}")

replace_db_in_file(r'c:\Users\Kandadi Charan Tej\OneDrive\Documents\Files\Projects\QuickJournal\frontend\app.js')
replace_db_in_file(r'c:\Users\Kandadi Charan Tej\OneDrive\Documents\Files\Projects\QuickJournal\backend\server.js')

print("Done updating databases.")
