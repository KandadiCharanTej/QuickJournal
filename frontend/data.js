const academicData = {
    // =========================================================
    //  YEAR I
    // =========================================================
    "I": {

        // ----- TERM 1 -----
        "1": {
            "Engineering Chemistry": {
                "1": { title: "Fundamentals of Chemistry", syllabus: "Introduction, Atomic Models, Electronic Configuration. Periodic Table, Properties, and Types of Elements [cite: 827-829]." },
                "2": { title: "Chemical Bonding", syllabus: "Ionic Bonding, Covalent Bonding, Lewis Structures, VSEPR Theory and Molecular Orbital Theory [cite: 830-831]." },
                "3": { title: "Acids and Bases", syllabus: "Introduction, Arrhenius's Concept, Bronsted-Lowry Concept, and Lewis's Concept [cite: 832-833]." },
                "4": { title: "Chemical Thermodynamics", syllabus: "Introduction, Laws of Thermodynamics, Enthalpy, Entropy, and Gibbs free energy [cite: 834-835]." },
                "5": { title: "Chemical Kinetics", syllabus: "Introduction, Rate of reaction, Rate Law expression and Reaction Mechanism [cite: 836-837]." },
                "6": { title: "Electrochemistry", syllabus: "Introduction, Electrochemical Cell, Electrode Potential and EMF of Galvanic Cells, Electrochemical Series and Nernst Equation [cite: 838-839]." },
                "7": { title: "Fuel Cells and Batteries", syllabus: "Introduction, Hydrogen-Oxygen Fuel Cells, Phosphoric Acid Fuel Cells, Molten Carbonate Fuel Cells, Batteries- Primary, Secondary and Modern Batteries [cite: 840-841]." },
                "8": { title: "Water Treatment", syllabus: "Introduction, Sources of Water, Water Quality Standards, Water Hardness, Water for Industries, Boiler Problems, Softening Methods, and Desalination [cite: 842-843]." },
                "9": { title: "Nanomaterials", syllabus: "Introduction, Classification, Properties, Synthesis and Applications of Nanomaterials [cite: 844-845]." },
                "10": { title: "Nanomaterials Characterization", syllabus: "Introduction, Scanning Electron Microscope (SEM) and Transmission Electron Microscope (TEM) of ZnO and Fe2O3 [cite: 846-847]." }
            },
            "Engineering Physics": {
                "1": { title: "Fundamentals of Quantum Physics", syllabus: "Planck's theory, photoelectric effect, wave-particle duality, Schrödinger's equation, Particle in 1 D potential box, Quantum tunnelling (Transmission and Absorption coefficients) [cite: 107-109]." },
                "2": { title: "Introduction to Quantum Computing", syllabus: "Foundation for quantum computing, Qubits, Superposition, Quantum entanglement, Quantum gates, Quantum circuits [cite: 110-113]." },
                "3": { title: "Semiconductor Physics", syllabus: "Energy bands in solids, intrinsic & extrinsic semiconductors, PN junction diodes, transistors (Qualitative)- operation and switching, Relevance in CPUs, GPUs, SSDs[cite: 114]." },
                "4": { title: "Optoelectronics & Displays", syllabus: "Light-matter interaction, LEDs, photodiodes, laser diodes, Display technologies: LCD, LED, OLED, Applications: optical sensors, monitors, communication hardware [cite: 115-117]." },
                "5": { title: "Magnetism in Data Storage", syllabus: "Magnetic materials - classification, Domain theory, Hysteresis, Soft and Hard Magnetic materials, magnetic shielding, Magnetic domains in HDDs, Working of HDDs, MRAM [cite: 118-120]." },
                "6": { title: "Ferro Electricity & Memory", syllabus: "Dielectric Materials, Ferroelectricity, Charge storage in capacitors, Ferro electric capacitors, Ferro electric transistors, Ferro electric Memristors, Dielectric tunnelling, Emerging memory: FeRAM [cite: 121-124]." },
                "7": { title: "EM Waves & Light Interference", syllabus: "Light as an Electromagnetic Wave, Principle of Superposition, and Interference, Wave Intensity and Mathematical Representation, Digital Sensors and Image Capture [cite: 125-126]." },
                "8": { title: "Matrix Representation", syllabus: "Mathematical Modelling of Interference, Intensity Computation in a Matrix Format, Image as a Matrix: Bridging Physics and Computing, Interdisciplinary Applications [cite: 127-131]." },
                "9": { title: "Photonics & Fiber Optic", syllabus: "Total internal reflection, optical fibers, acceptance angle, Numerical Aperture (Qualitative), Signal loss mechanisms: attenuation, dispersion, Fiber Optic Communication- Applications [cite: 132-136]." },
                "10": { title: "Sensors and its Applications", syllabus: "Sensors, Sensor characteristics: sensitivity, precision, accuracy, Principles of mechanical, optical, and thermal sensors, Applications in robotics, automation, IoT, and smart systems [cite: 137-140]." }
            },
            "Fundamentals of Web Development": {
                "1": { title: "Web Basics & HTML Basics", syllabus: "Importance of Web Development, Syntax, Debugging, Getting Started with HTML and CSS, HTML Structure: Headings, Paragraphs, Containers, Buttons [cite: 212-215]." },
                "2": { title: "CSS Styling & Box Model", syllabus: "CSS Text Styling, CSS Colors, Background: Color, Image, Size, CSS Box Model: Height, Width, Border, Padding, Viewport, Introduction to Bootstrap [cite: 218-222]." },
                "3": { title: "Flexbox and Bootstrap", syllabus: "Bootstrap Flexbox Properties: Container, Direction, Justify Content, HTML Elements: Images, Void Elements, CSS Margin, Bootstrap Utilities [cite: 223-227]." },
                "4": { title: "HTML5 Multimedia", syllabus: "HTML Attributes: Anchor, Horizontal Rule, Hyperlinks, Multimedia Support: Audio, Video Elements, Semantic Elements [cite: 228-230]." },
                "5": { title: "Responsive Web Design", syllabus: "Bootstrap Grid: Container, Row, Column, Breakpoints, Navbar, CSS Selectors: ID, Class, Type, Pseudo-classes, Combinators, Specificity [cite: 231-236]." },
                "6": { title: "Bootstrap Containers", syllabus: "Bootstrap Utilities: Sizing, Icons, Components: Modal, Buttons, Cards, Minimal CSS Utilities: Flex, Position, Shadow, Colors [cite: 237-240]." },
                "7": { title: "CSS Animation & Design", syllabus: "CSS Gradients: Linear, Radial, CSS Transitions & Animations: Transforms, Keyframes, Timing, Animatable and Non-Animatable Properties [cite: 241-243]." },
                "8": { title: "CSS Flexbox & Grid Layout", syllabus: "Box Sizing & Overflow, handling sizing and overflow, Flexbox and Media Queries: wrap, Align Self, Order, Responsive Design [cite: 244-246]." },
                "9": { title: "Flexbox Sizing & CSS Grid", syllabus: "Flex Grow, Flex Shrink, Flex Basis, CSS Grid Basics: Grid Line, Cell, Track, Area, Grid Gap, Fraction unit, Template Rows & Columns [cite: 252-254]." },
                "10": { title: "CSS Positioning & Tailwind", syllabus: "Responsive Grid Layout, CSS Positioning Basics, Combining Flexbox + Grid, Tailwind CSS: Setup, Grid Utility Classes, Responsive Utility Classes [cite: 255-257]." }
            },
            "Mathematics for Computer Science": {
                "1": { title: "Number Systems & Bitwise", syllabus: "Binary, Decimal, Octal, Hexadecimal conversions, Basic Arithmetic operations, Bitwise Operators: AND, OR, NOT, XOR, NAND, NOR, Shift Operations, Optimization applications [cite: 347-349]." },
                "2": { title: "Signed & Floating Point", syllabus: "Representation of Signed & Unsigned Integers, Sign Magnitude, 1's & 2's complement, Overflow, Underflow, Wrap Around, IEEE 754 Structure, Rounding Errors [cite: 350-354]." },
                "3": { title: "Modular Mathematics", syllabus: "GCD and LCM, Euclidean Theorem, Modulo Arithmetic, Multiplicative Inverse, Extended Euclidean Algorithm, Fermat's Little Theorem, Error Detection: Parity, Checksum, CRC [cite: 355-359]." },
                "4": { title: "Logic & Proof Methods", syllabus: "Propositional logic, Logical Equivalences, Predicates & quantifiers, Rules of Inference, Proof Methods: Direct, Indirect, Vacuous, Trivial, Proof by Cases [cite: 360-361]." },
                "5": { title: "Proofs & Matrices", syllabus: "Mathematical Induction, Strong Induction, Matrix Addition and Multiplication, Determinants, Adjoint and Inverse of a Matrix and their properties [cite: 362-363]." },
                "6": { title: "Permutations & Combinations", syllabus: "Principles of Counting, Permutations: Arrangement with/without repetition, Circular Permutation, Combinations: With/without replacement, Selection problems [cite: 364-367]." },
                "7": { title: "Sequences & Series", syllabus: "Arithmetic, Geometric, and Harmonic Progression, AM, GM, HM relations, AGP Series (nth term, sum in finite and infinite conditions) [cite: 368-372]." },
                "8": { title: "Sets & Binary Operations", syllabus: "Set Theory Fundamentals, Set Operations, Venn Diagrams, Cartesian Products, Functions: Domain, Range, Codomain, Injective, Surjective, Bijective [cite: 373-374]." },
                "9": { title: "Relations", syllabus: "Types of Relations (Reflexive, Symmetric, Transitive, Antisymmetric), Equivalence, Partial Order, Hasse Diagrams, Lattices [cite: 375-377]." },
                "10": { title: "Recursion & Recurrence", syllabus: "Recursive Definitions, Recursively defined functions and sets, Recurrence Relations, Linear Homogeneous Recurrence Relations [cite: 378-380]." }
            },
            "Python Programming-1": {
                "1": { title: "Python Basics", syllabus: "Literal Constants, Variables, Identifiers, Data Types, I/O Operations, Comments, Reserved Words, Indentation, Operators: Arithmetic, Comparison, Bitwise, Logical, Precedence [cite: 434-436]." },
                "2": { title: "Conditional Branching", syllabus: "Selection/Conditional Branching Statements: if, if-else, Nested if, if-elif-else statements [cite: 437-438]." },
                "3": { title: "Loop Structures-1", syllabus: "Loop Structures/Iterative Statements-1: while, for loops with examples [cite: 439-440]." },
                "4": { title: "Loop Structures-2", syllabus: "Nested loops, continue, break, pass statements[cite: 441]." },
                "5": { title: "Strings & Operations", syllabus: "Concatenating, Appending, Multiplying strings, Built-in String methods, Slice Operation, Iterating String, String Module [cite: 442-443]." },
                "6": { title: "Lists", syllabus: "Creation of Lists, Indexing, Slicing, Updating Lists, List Methods, Iterating Lists, Nested Lists [cite: 444-445]." },
                "7": { title: "Tuples", syllabus: "Creating Tuples, Accessing Elements, Tuple Methods [cite: 446-447]." },
                "8": { title: "Functions", syllabus: "Declaration, Definition, Variable Scope, Lifetime, Return Statements, Types of Arguments, Lambda function [cite: 448-449]." },
                "9": { title: "Recursion & Modules", syllabus: "Recursion, Modules- Built-in Modules, User-defined Modules [cite: 450-451]." },
                "10": { title: "GUI & Libraries", syllabus: "Modules and Libraries: Labels, Buttons, Entry, Text, Frame, Menu, Simple GUI Applications, Basic Packages and Libraries [cite: 452-453]." }
            }
        },

        // ----- TERM 2 -----
        "2": {
            "Calculus and Differential Equations": {
                "1": { title: "Multivariable Differential Calculus", syllabus: "Partial Derivatives, Gradient vectors, Chain rule, Jacobian and Hessian Matrices, Cartesian & Polar coordinates, Functions of two variables [cite: 533-534]." },
                "2": { title: "Optimization & Extrema", syllabus: "Newton’s method for optimization, Multivariable optimization, Total Differential, Extreme Points, Lagrange’s Multiplier Method [cite: 535-536]." },
                "3": { title: "Double Integrals", syllabus: "Double integration: Introduction, Change of order of integration, Change of variable for double integrals [cite: 537-538]." },
                "4": { title: "Triple Integrals", syllabus: "Introduction & Geometric interpretation of Triple Integrals, evaluation of triple integrals, applications of double and triple integrals [cite: 539-540]." },
                "5": { title: "Convergence & Divergence", syllabus: "Sequence and series, Convergence, Infinite Series-Tests: D’Alembert’s ratio test, Alternating series, Absolute and Conditional convergence, Power series [cite: 541-542]." },
                "6": { title: "Exact Differential Equations", syllabus: "Exact Differential Equations and Integrating Factors [cite: 543-544]." },
                "7": { title: "Linear & Bernoulli’s DE", syllabus: "Linear Differential equations and Bernoulli’s Differential equations [cite: 545-546]." },
                "8": { title: "Applications of First-Order DE", syllabus: "LCR circuits, Newton’s law of cooling, and Growth and decay [cite: 546-547]." },
                "9": { title: "Higher Order DE", syllabus: "Homogeneous DE – Complementary functions. Non-Homogeneous DE - Particular Integrals for Non-Homogeneous part: eax, Sinax, cosax, xk, eax f(x) [cite: 548-550]." },
                "10": { title: "Partial Differential Equations", syllabus: "First order PDEs, solvable by direct integration, Lagrange’s method for first-order Linear PDEs, Nonlinear first-order PDEs [cite: 551-552]." }
            },
            "Frontend Development Fundamentals": {
                "1": { title: "Introduction to JavaScript", syllabus: "Variable Declaration, Data Types, Expressions, Operators, Control Statements: Conditional, Switch, DOM and Event Fundamentals: DOM Tree, Methods, onclick Event [cite: 602-604]." },
                "2": { title: "DOM Manipulations & Arrays", syllabus: "More DOM Manipulations, Loops, Methods: push, pop, splice, findIndex, includes, more methods and String manipulations [cite: 605-608]." },
                "3": { title: "JS Objects & Functions", syllabus: "Objects: Creation, Accessing, Destructuring, Modifying, Spread, Rest, Functions: Declaration, Expressions, Arrow Functions, Callbacks, Schedulers [cite: 609-610]." },
                "4": { title: "Event Listeners & HTTP", syllabus: "Events: Handlers, Listeners, Event Object, Keyboard Events, HTTP Basics: Protocols, Requests, Fetch API, Introduction to JSON, JSON Methods [cite: 611-613]." },
                "5": { title: "Form Handling and Events", syllabus: "Events: Event Object Methods, preventDefault, Form Handling: Form Events, Basic Error Handling, Building a form [cite: 614-616]." },
                "6": { title: "Functions and Mutability", syllabus: "JS Functions: Factory, Constructor, Function Properties, Built-in Constructor Functions, Date Constructor Functions, this, Mutability: Immutable and Mutable Values [cite: 617-619]." },
                "7": { title: "JS Behind the Scenes", syllabus: "JavaScript Execution Model: JS Engine, Stack, Queues, Event Loops [cite: 620-621]." },
                "8": { title: "JS Classes & Promises", syllabus: "JS Classes: Class, Inheritance, JS Promises: Promise States, Consuming Promises, Async/Await [cite: 622-624]." },
                "9": { title: "JS Array Methods & Hoisting", syllabus: "JS Concepts: Hoisting, Clean Code Guidelines, Array Methods: map, reduce, filter, Mutable & Immutable methods [cite: 625-627]." },
                "10": { title: "Running JavaScript Locally", syllabus: "JS Modules: Node JS, Running JS Using Node JS, Common JS and Modern JS Module Exports, Node Packages: Core Modules, NPM, Third-party Packages [cite: 628-630]." }
            },
            "Python Programming-2": {
                "1": { title: "Sets and Set Operations", syllabus: "Set - Creation, add Element, remove, delete, update, Conversions with sets, Set operations - union, intersection, difference, and symmetric difference [cite: 688-691]." },
                "2": { title: "Dictionaries", syllabus: "Concepts of Key-value pair, dictionary - creating, accessing, update, delete operations, Nested dictionaries, problem solving with Dictionaries [cite: 692-693]." },
                "3": { title: "Multi-Dimensional Lists", syllabus: "Multi-Dimensional Lists: Creating 2-D List, Matrix Operations - addition, multiplication, transpose, inverse, list creation with conditions and filtering [cite: 694-695]." },
                "4": { title: "Introduction to OOP", syllabus: "Procedural vs Object Oriented approach, OOP Concepts - Principles of OOP, classes and objects - Working with classes and objects [cite: 696-698]." },
                "5": { title: "Class Attributes and Methods", syllabus: "Attributes - class attributes, Instance attributes, Access Modifiers, Methods - Instance, class, and static methods, Implementing Encapsulation [cite: 699-700]." },
                "6": { title: "Inheritance and Composition", syllabus: "Inheritance - Superclass and subclass relationships, multiple inheritance, and multiple-level inheritance, and Composition [cite: 701-702]." },
                "7": { title: "Abstraction & Polymorphism", syllabus: "Abstract Classes - Implementing abstract classes and methods, Abstraction vs Encapsulation. Polymorphism - Operator overloading, function overloading, method overriding [cite: 703-704]." },
                "8": { title: "Errors & Date Time", syllabus: "Errors & Exceptions: Syntax, Logical, ZeroDivisionError, TypeError, KeyError; DateTime Handling: date, time, and timedelta classes [cite: 705-707]." },
                "9": { title: "Directories & File Handling", syllabus: "Directories & Paths: Import, Move, Copy, Delete Directory Tree, Error Handling, File Operations: Read, Write, Append, Merge, Error Handling [cite: 708-710]." },
                "10": { title: "AI App Development Tools", syllabus: "Developing Application: To build a smart AI-based App Development environment [cite: 711-712]." }
            }
        },

        // ----- TERM 3 -----
        "3": {
            "Engineering Chemistry": {
                "1": { title: "Fundamentals of Chemistry", syllabus: "Introduction, Atomic Models, Electronic Configuration, Periodic Table, Properties, and Types of Elements [cite: 1144-1146]." },
                "2": { title: "Chemical Bonding", syllabus: "Ionic Bonding, Covalent Bonding, Lewis Structures, VSEPR Theory and Molecular Orbital Theory [cite: 1147-1148]." },
                "3": { title: "Acids and Bases", syllabus: "Introduction, Arrhenius's Concept, Bronsted-Lowry Concept, and Lewis's Concept [cite: 1149-1150]." },
                "4": { title: "Chemical Thermodynamics", syllabus: "Introduction, Laws of Thermodynamics, Enthalpy, Entropy, and Gibbs free energy [cite: 1151-1152]." },
                "5": { title: "Chemical Kinetics", syllabus: "Introduction, Rate of reaction, Rate Law expression and Reaction Mechanism [cite: 1153-1154]." },
                "6": { title: "Electrochemistry", syllabus: "Introduction, Electrochemical Cell, Electrode Potential and EMF of Galvanic Cells, Electrochemical Series and Nernst Equation [cite: 1155-1156]." },
                "7": { title: "Fuel Cells and Batteries", syllabus: "Introduction, Hydrogen-Oxygen Fuel Cells, Phosphoric Acid Fuel Cells, Molten Carbonate Fuel Cells, Batteries- Primary, Secondary and Modern Batteries [cite: 1157-1158]." },
                "8": { title: "Water Treatment", syllabus: "Introduction, Sources of Water, Water Quality Standards, Water Hardness, Water for Industries, Boiler Problems, Softening Methods, and Desalination [cite: 1159-1160]." },
                "9": { title: "Nanomaterials", syllabus: "Introduction, Classification, Properties, Synthesis and Applications of Nanomaterials [cite: 1161-1162]." },
                "10": { title: "Nanomaterials Characterization", syllabus: "Introduction, Scanning Electron Microscope (SEM) and Transmission Electron Microscope (TEM) of ZnO and Fe2O3 [cite: 1163-1164]." }
            },
            "Frontend Development Advanced": {
                "1": { title: "Introduction to ReactJS", syllabus: "ReactJS Basics: Advantages, Creating Elements, JSX; Components: Props Data flows, Reusability, Lists, Keys, Functional Components, Creating React App using Vite [cite: 805-807]." },
                "2": { title: "State & Conditional Rendering", syllabus: "Identifying State, Updating styles based on State; Conditional Rendering: if-else, element variables, ternary, logical AND; Multiple States: Maintaining and managing multiple states & lists; Common Mistakes [cite: 808-811]." },
                "3": { title: "Debugging & State Handling", syllabus: "Building Projects, Identifying the State, Updating styles based on State; Debugging: Browser Developer Tools, React Developer Tools [cite: 812-813]." },
                "4": { title: "List as State & Best Practices", syllabus: "Understanding Third-party Packages, Unique keys (UUID) package, Updating objects/lists in state (immutability), State handling best practices [cite: 814-815]." },
                "5": { title: "Effect Hooks & Schedulers", syllabus: "React Hooks: useEffect, Rules of Hooks; Execution Context, Storage Mechanisms, Local Storage, Dependency Array, Multiple useEffects, Optimizing Performance; JSON Methods [cite: 816-820]." },
                "6": { title: "API Calls & Routing", syllabus: "Making API Calls; React under the Hood: Reconciliation, Batch Updating, Setter Function with Callback, Children Prop, Controlled vs uncontrolled inputs; React Router: Components, Path Parameters [cite: 821-827]." },
                "7": { title: "Auth & Token Management", syllabus: "Client-Server Communication: Authentication vs Authorization; JWT Token, Storage Mechanisms, Cookies; React Router Hooks: useNavigate, Navigate Component [cite: 828-830]." },
                "8": { title: "Protected Routes & API Patterns", syllabus: "Component: Wrapper Component, Protected Route; API Call: Integrating APIs, API Call Possible Views[cite: 831]." },
                "9": { title: "Context API", syllabus: "Prop Drilling, Provider, Consumer, useContext, Updating context values [cite: 832-833]." },
                "10": { title: "React Context Hands-on", syllabus: "Building an E-Commerce website using context; Context performance & best practices [cite: 834-836]." }
            },
            "Introduction to DBMS": {
                "1": { title: "Database Fundamentals", syllabus: "Data, Database, DBMS Advantages, Types of Databases, Relational Database, Keys, ER Model Core Components: Entities, Attributes and Relationships; File vs. DBMS [cite: 902-904]." },
                "2": { title: "SQL Basics & Table Operations", syllabus: "Intro to DML & DDL, Instances & Schema; DDL: Create Table, Schema, Alter Table; DML: Update, Delete, Inserting Rows, Retrieving Data [cite: 905-908]." },
                "3": { title: "Operators in SQL", syllabus: "Comparison and Logical Operators, Pattern Matching with LIKE, Operator Precedence [cite: 909-910]." },
                "4": { title: "Filtering & Pagination", syllabus: "IN and BETWEEN, Result Ordering using ORDER BY, Pagination using LIMIT and OFFSET clauses [cite: 911-912]." },
                "5": { title: "Aggregations & Grouping", syllabus: "Data Aggregation Methods, Grouping Data using Group By, Filtering Data using Having [cite: 913-914]." },
                "6": { title: "SQL Expressions & Functions", syllabus: "SQL Expressions in SELECT, WHERE, HAVING; Date Function (strftime), CAST Function, Arithmetic Functions [cite: 915-916]." },
                "7": { title: "Case Clause & Set Operations", syllabus: "SQL Case Clause and use cases; Set Operations: UNION, INTERSECT, and EXCEPT [cite: 917-918]." },
                "8": { title: "Database Modeling (ER)", syllabus: "Relationship Types (1:1, 1:N, M:N), Implementation Strategies, Mapping ER to Relational Schema [cite: 919-920]." },
                "9": { title: "Joins & Multi-Table Queries", syllabus: "Types of Joins: Inner, Left, Natural, Right, Full, Cross, and Self Join [cite: 921-922]." },
                "10": { title: "View, Subqueries, & Index", syllabus: "Views in DBMS, Querying Using Views, Sub Queries, Introduction to Indexes In SQL [cite: 923-924]." }
            },
            "Engineering Physics": {
                "1": { title: "Fundamentals of Quantum Physics", syllabus: "Planck’s theory, photoelectric effect, wave-particle duality, Schrödinger’s equation, Particle in 1 D potential box, Quantum tunnelling (Transmission and Reflection coefficients)" },
                "2": { title: "Introduction to Quantum Computing", syllabus: "Foundation for quantum computing, Qubits, Superposition, Quantum entanglement, Quantum gates, Quantum circuits" },
                "3": { title: "Semiconductor Physics and Device Applications", syllabus: "Energy bands in solids, intrinsic & extrinsic semiconductors, PN junction diodes, transistors (Qualitative)– operation and switching, Relevance in CPUs, GPUs, SSDs" },
                "4": { title: "Optoelectronics and Display Technologies", syllabus: "Light-matter interaction, LEDs, photodiodes, laser diodes, Display technologies: LCD, LED, OLED, Applications - optical sensors, monitors, communication hardware" },
                "5": { title: "Magnetism in Data Storage", syllabus: "Magnetic materials – classification, Domain theory, Hysteresis, Soft and Hard Magnetic materials, magnetic shielding, Magnetic domains in HDDs, Working of HDDs, MRAM" },
                "6": { title: "Ferro Electricity and Memory Technologies", syllabus: "Dielectric Materials, Ferroelectricity, Charge storage in capacitors, Ferro electric capacitors, Ferro electric transistors, Ferro electric Memristors, Dielectric tunnelling, Emerging memory: FeRAM." },
                "7": { title: "Electromagnetic Waves and Light Interference in Imaging", syllabus: "Light as an Electromagnetic Wave, Principle of Superposition, and Interference, Wave Intensity and Mathematical Representation, Digital Sensors and Image Capture" },
                "8": { title: "Matrix Representation in Optical Imaging", syllabus: "Mathematical Modelling of Interference, Intensity Computation in a Matrix Format, Image as a Matrix: Bridging Physics and Computing, Interdisciplinary Applications" },
                "9": { title: "Photonics and Fiber Optic Communication", syllabus: "Total internal reflection, optical fibers, acceptance angle, Numerical Aperture (Qualitative), Signal loss mechanisms: attenuation, dispersion, Fiber Optic Communication - Applications in high-speed internet and cloud data transfer" },
                "10": { title: "Sensors and its Applications", syllabus: "Sensors, Sensor characteristics: sensitivity, precision, accuracy, Principles of mechanical, optical, and thermal sensors, Applications in robotics, automation, IoT, and smart systems" }
            }
        },

        // ----- TERM 4 -----
        "4": {
            "Environmental Science": {
                "1": {
                    title: "Assignment - 1",
                    questions: [
                        "Explain the structure and functions of an ecosystem.",
                        "What is ecological balance? Explain its importance.",
                        "Explain food chain with a suitable example.",
                        "What are trophic levels? Explain different trophic levels.",
                        "Explain ecological pyramids and their types.",
                        "Explain the pyramid of energy and its importance."
                    ]
                },
                "2": {
                    title: "Assignment - 2",
                    questions: [
                        "Explain the Carbon Cycle.",
                        "Explain the Nitrogen Cycle.",
                        "Explain the Greenhouse Effect and Global Warming.",
                        "Explain Ozone Layer Depletion and Climate Change.",
                        "Explain Air Pollution, its Sources, and Effects.",
                        "Explain Air Pollution Control Devices."
                    ]
                },
                "3": {
                    title: "Assignment - 3",
                    questions: [
                        "Explain Noise Pollution, its Sources, and Effects on Human Health.",
                        "How is Noise Measured? Explain Prevention and Control Measures.",
                        "Explain Noise Pollution Rules.",
                        "Explain Water Pollution, its Sources, and Types.",
                        "Explain Surface Water and Groundwater Pollution.",
                        "Explain Water Quality Parameters: pH, Turbidity, Total Solids, TSS, BOD, and COD."
                    ]
                },
                "4": {
                    title: "Assignment - 4",
                    questions: [
                        "Explain the stages of Wastewater Treatment.",
                        "Explain Primary, Secondary, and Tertiary Treatment of Wastewater.",
                        "Explain Soil Pollution, its Causes, Effects, and Control Measures.",
                        "Explain Solar Energy and its Applications.",
                        "Explain Biomass Energy and Biogas Production.",
                        "Explain Wind Energy Systems, Applications, and Benefits."
                    ]
                },
                "5": {
                    title: "Assignment - 5",
                    questions: [
                        "Explain Hydrogen Energy, its Advantages, and Applications.",
                        "Explain Tidal Energy and Ocean Energy.",
                        "Explain Geothermal Energy and its Applications.",
                        "Discuss the Environmental Benefits and Future Prospects of Alternative Energy Sources.",
                        "Explain E-Waste Management and the 3R Principles.",
                        "Explain Environmental Legislation and ISO 14000 Standards."
                    ]
                }
            },
            "Indian Heritage and Culture": {
                "1": {
                    title: "Assignment 1",
                    questions: [
                        "Explain the architectural and cultural significance of Sanchi Stupa.",
                        "Describe the artistic features and historical importance of Ajanta Caves.",
                        "Write an essay on the engineering excellence of Konark Sun Temple.",
                        "Discuss the architectural beauty and heritage value of Taj Mahal.",
                        "Explain the importance of ancient Indian engineering with reference to Mahabalipuram and Red Fort."
                    ]
                },
                "2": {
                    title: "Assignment 2",
                    questions: [
                        "Explain the significance of Indian festivals in preserving cultural traditions.",
                        "Discuss the importance of rituals and customs in Indian society.",
                        "Describe the role of regional traditions in promoting cultural diversity in India.",
                        "Write an essay on religious and seasonal festivals celebrated in different parts of India.",
                        "Explain how Indian festivals promote unity, harmony, and social values among people."
                    ]
                },
                "3": {
                    title: "Assignment 3",
                    questions: [
                        "Explain the contributions of C. V. Raman to modern Indian science.",
                        "Write a short note on the achievements of A. P. J. Abdul Kalam in space and nuclear science.",
                        "Discuss the development of modern science and technology in India after independence.",
                        "Explain how modern Indian science bridges the gap between ancient traditions and present-day innovations.",
                        "Describe the role of physics, space research, and nuclear science in the progress of modern India."
                    ]
                },
                "4": {
                    title: "Assignment 4",
                    questions: [
                        "Explain the significance of traditional Indian crafts and discuss the cultural importance of pottery, woodcraft, and Bidriware.",
                        "Describe the major handloom traditions of India, highlighting the features of Banarasi, Pashmina, Kanchipuram, and Paithani textiles.",
                        "Discuss the role of folk art in preserving Indian cultural heritage with reference to Madhubani, Warli, and Kalamkari art forms.",
                        "Examine the artistic and cultural significance of stone carvings in the Indian artistic tradition.",
                        "How do traditional Indian crafts and folk arts contribute to the preservation and promotion of India's cultural identity? Explain with examples."
                    ]
                },
                "5": {
                    title: "Assignment 5",
                    questions: [
                        "Explain the concept of holistic healthcare in India. Discuss the role of Yoga, Ayurveda, Siddha, and Unani systems in promoting physical, mental, and spiritual well-being.",
                        "Describe the eight limbs of Ashtanga Yoga as explained by Patanjali and explain how Yoga contributes to preventive healthcare and stress management.",
                        "Discuss the meaning of cultural diversity in India. How do languages, customs, traditions, food habits, and clothing contribute to India's 'Unity in Diversity'?",
                        "Examine the importance of preserving Indian cultural heritage. Explain the role of UNESCO, government organizations, educational institutions, and society in heritage conservation.",
                        "How do traditional healthcare systems and cultural heritage together contribute to the promotion of India's identity and global recognition? Explain with suitable examples."
                    ]
                }
            }
        }
    },
    
    // =========================================================
    //  YEAR II
    // =========================================================
    "II": {
        // ----- TERM 1 -----
        "1": {
            "Data Structures using C++": {
                "1": { title: "Introduction to C++ Programming", syllabus: "Evolution of C++, Features of C++, Structure of a C++ Program, Tokens, Keywords, Identifiers, Variables, Constants, Data Types, Operators, Input and Output Streams, Type Conversion." },
                "2": { title: "Control Statements", syllabus: "Decision Making Statements, Looping Statements, Functions." },
                "3": { title: "Arrays – 1D", syllabus: "One-Dimensional Numeric Arrays, Array Declaration and Initialization, Passing Arrays to Functions, Operations on single dimensional Arrays." },
                "4": { title: "Arrays – 2D", syllabus: "Two-Dimensional Numeric Arrays, Matrix Operations, Operations on Two dimensional Arrays." },
                "5": { title: "String Arrays", syllabus: "String representation and built-in methods; character frequency and comparison techniques; string traversal and reversal; word-level manipulation and tokenization; character mapping and pattern matching." },
                "6": { title: "Structures", syllabus: "Introduction and need for structures, structure declaration and initialization, accessing members, arrays of structures, nested structures, and structures with functions." },
                "7": { title: "Data Structures performance Analysis", syllabus: "Introduction to data structures, type of datastructures, Characteristics of Algorithms, Abstract Data Types, Time Complexity, Space Complexity, Asymptotic Notations." },
                "8": { title: "Stacks", syllabus: "Stack ADT, Stack Operations, Stack Implementation using Arrays, Applications of Stacks." },
                "9": { title: "Queues", syllabus: "Queue ADT, Queue Operations Queues Implementation using Arrays, Types and Applications of Queues." },
                "10": { title: "STL Fundamentals & Containers", syllabus: "Pairs and vectors with dynamic resizing and indexing; iterators and built-in utility functions, Deque, stack, and queue operations; sets and maps." }
            },
            "Advanced Database Management Systems": {
                "1": { title: "Relational Query Languages & Extended ER Models", syllabus: "Introduction to relational query languages and relational algebra operations such as Selection, Projection, Union, Composition, and Cartesian Product. Entity Relationship (ER) modeling, ER diagrams, naming conventions, subclasses, superclasses, inheritance, specialization, generalization, aggregation, and modeling of union types using categories." },
                "2": { title: "Fundamentals of Normalization", syllabus: "Schema refinement techniques to improve database design by eliminating redundancy and anomalies. Functional dependencies, types of functional dependencies, and normalization concepts with First Normal Form (1NF) and Second Normal Form (2NF)." },
                "3": { title: "Advanced Normalization", syllabus: "Advanced normalization techniques including Third Normal Form (3NF), Boyce-Codd Normal Form (BCNF), Fourth Normal Form (4NF), and Fifth Normal Form (5NF). Functional dependency analysis, decomposition techniques, and denormalization for performance optimization." },
                "4": { title: "Transactions in DBMS", syllabus: "Introduction to database transactions, transaction management, and ACID properties to ensure reliable data processing. Transaction life cycle, transaction states, scheduling concepts, and the need for concurrency control in multi-user environments." },
                "5": { title: "Concurrency Control", syllabus: "Concurrency control mechanisms for maintaining database consistency during simultaneous transactions. Locking techniques including shared and exclusive locks, timestamp-based protocols, serializability concepts, and deadlock handling methods." },
                "6": { title: "Storage and File Structure", syllabus: "Database storage architecture, RAID technology, and file organization methods for efficient data storage and retrieval. Organization of records in files, storage structures, and management of metadata through the data dictionary." },
                "7": { title: "Database Recovery Techniques", syllabus: "Recovery mechanisms to restore databases after transaction, system, or media failures. Recovery concepts, shadow paging, log-based recovery, database backup strategies, and recovery from catastrophic failures." },
                "8": { title: "Introduction to NoSQL Databases and MongoDB", syllabus: "Overview of NoSQL databases, their characteristics, and comparison with relational databases. Introduction to MongoDB architecture, advantages, types of NoSQL databases, installation, and environment setup using MongoDB Atlas and Compass." },
                "9": { title: "Performing CRUD Operations in MongoDB", syllabus: "Connecting to MongoDB Atlas and performing Create, Read, Update, and Delete (CRUD) operations on collections and documents. Managing databases using MongoDB commands, filtering records, and importing/exporting data." },
                "10": { title: "Advanced Querying and Data Aggregation in MongoDB", syllabus: "Advanced querying using conditional, comparison, and logical operators for efficient data retrieval. Sorting, limiting results, aggregation framework, grouping operations, and handling complex data types such as embedded documents and arrays." }
            },
            "Probability Theory and Statistical Analysis": {
                "1": { title: "Introduction to Statistics", syllabus: "Introduction to statistics, representation of small datasets using frequency tables, histograms, ogives, stem and leaf plots, measures of central tendency, measures of variability, Chebyshev’s inequality, normal datasets, skewness of data, and representation of two quantitative variables on a scatter plot." },
                "2": { title: "Introduction to Probability", syllabus: "Basics of probability, axioms of probability, conditional probability, Bayes’ theorem, independent and dependent events." },
                "3": { title: "Random Variables", syllabus: "Random variables, types of random variables, probability distribution function, mean, variance, and standard deviation of discrete random variables, numericals on mean and variance, probability density function." },
                "4": { title: "Discrete Probability Distributions", syllabus: "Binomial distribution, moment generating function, mean and variance of binomial distribution, Poisson distribution, mean and variance of Poisson distribution, relationship between binomial and Poisson distributions." },
                "5": { title: "Continuous Probability Distributions", syllabus: "Normal distribution and its properties, use of normal distribution table, numericals on normal distribution, mean and variance of normal distribution, uniform, gamma, exponential, and beta distributions." },
                "6": { title: "Sampling & Estimation", syllabus: "Introduction to sampling and types of sampling, sampling distributions, central limit theorem, t-distribution, chi-squared distribution, F-distribution, estimation, point and interval estimation." },
                "7": { title: "Testing of Hypothesis – I", syllabus: "Testing of hypothesis, null and alternate hypotheses, type I and type II errors, level of significance, testing of hypothesis for mean." },
                "8": { title: "Testing of Hypothesis – II", syllabus: "Testing of hypothesis for all proportions, and numericals on all hypothesis testing models." },
                "9": { title: "Correlation", syllabus: "Correlation and covariance, types of correlation, coefficient of correlation, Spearman’s Rank correlation and coefficient." },
                "10": { title: "Regression", syllabus: "simple linear regression, Multiple linear regression with more than two independent variables, nonlinear regression, polynomial regression." }
            },
            "Foundation of Data Science": {
                "1": { title: "Basics of Data Science", syllabus: "Introduction: AI, Machine Learning, and Data Science, what is Data Science, Data Science Classification, Data Science Process. Data Types, Data Collections, Data Pre-processing." },
                "2": { title: "Tool Boxes for Data Scientist", syllabus: "Fundamental python libraries for Data Scientist, SciPy and sci - kitLearn, matplotlib, seaborn, PyBrain, Pylearn2; Data preprocessing techniques - read, select, filter, manipulate, sort, group, rank and plot the data. Normalizations." },
                "3": { title: "Data Analysis and Data Analytics", syllabus: "Descriptive Analysis - Variables, Frequency Distribution, Measures of Centrality and Dispersion of a Distribution. Diagnostic Analytics - Correlations. Predictive Analytics, Prescriptive Analytics, Exploratory Analysis and Mechanistic Analysis." },
                "4": { title: "Dimensionality Reduction and Feature Engineering", syllabus: "Principal Component Analysis (PCA), Linear Discriminant Analysis (LDA) and t-SNE, Singular Value Decomposition (SVD) , Feature Extraction and Feature Selection, Feature Transformation, Creating Interaction Features." },
                "5": { title: "Data Models", syllabus: "Overview of Data Models: Regression, Classification, Clustering, Advanced Regression Techniques: Implementing Multiple, Ridge, and Lasso Regression, Classification Models: Logistic Regression and Decision Trees, Clustering Models: K-Means and Hierarchical Clustering." },
                "6": { title: "Model Evaluation", syllabus: "Evaluation metrics types, Training vs. validation vs. testing, Regression Model Evaluation Metrics, Classification Model Evaluation Metrics, Clustering Metrics, Cross-Validation, Overfitting and underfitting." },
                "7": { title: "Recommendation Systems", syllabus: "Overview, Collaborative Filtering, Content-Based Filtering, Advanced Techniques in Collaborative Filtering, Hybrid Recommendation Systems, Evaluating Recommendation Systems, Real-World Applications." },
                "8": { title: "Data Visualization", syllabus: "Overview, Types of Data Visualizations, Basic Plotting with Python Matplotlib Features, Advanced visualizations using Seaborn, Interactive Visualization, Visualization for Exploratory Data Analysis (EDA), Data Visualization with Geospatial Data." },
                "9": { title: "Advanced Data Visualization Techniques", syllabus: "3D plotting, subplots with complex layouts, Facet grids, heatmaps with hierarchical clustering, Dashboards with Plotly and advanced interactivity, Data Visualization for Big Data, Introduction to BI tools: Tableau, Power BI." },
                "10": { title: "Ethics and Data Science", syllabus: "Doing Good Data Science, Data Ownership, The Five Cs, Implementing the Five Cs, Ethics and Security Training, Developing Guiding Principles, Building Ethics into a Data-Driven Culture, Regulation, Building Our Future, Case Study" }
            }
        }
    }
};