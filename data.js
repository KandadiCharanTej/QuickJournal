/**
 * data.js
 * Full syllabus data for all years, terms, subjects, and modules.
 *
 * Structure:
 *   academicData[Year][Term][Subject][ModuleNumber] = {
 *       title: "Short heading shown in dropdown and PDF",
 *       syllabus: "Full detailed syllabus text sent to AI for rich journal generation"
 *   }
 *
 * HOW TO ADD MORE SUBJECTS:
 *   Just copy any subject block below and fill in your own data.
 *   Year keys: "I", "II", "III", "IV"
 *   Term keys: "1", "2", "3", "4"
 *   Module keys: "1" through "10"
 */

const academicData = {

    // =========================================================
    //  YEAR I
    // =========================================================
    "I": {

        // ----- TERM 1 -----
        "1": {
            "Python Programming": {
                "1": {
                    title: "Python Basics & Operators",
                    syllabus: "Literal Constants, Variables and Identifiers, Data Types, Input/Output Operations, Comments, Reserved Words, Indentation. Operators and Expressions: Arithmetic, Comparison, Assignment, Relational, Unary, Bitwise, Shift, Logical, Membership, Identity, Operator Precedence and Associativity."
                },
                "2": {
                    title: "Conditional Branching Statements",
                    syllabus: "Selection/Conditional Branching Statements: if, if-else, Nested if, if-elif-else statements with practical examples and use cases."
                },
                "3": {
                    title: "Loop Structures - While & For",
                    syllabus: "Loop Structures/Iterative Statements: while loop, for loop with detailed examples, use cases, and iteration over sequences."
                },
                "4": {
                    title: "Nested Loops & Control Statements",
                    syllabus: "Nested loops, continue statement, break statement, pass statement with practical examples and pattern problems."
                },
                "5": {
                    title: "Strings & String Operations",
                    syllabus: "Strings and its operations: Concatenating, Appending, Multiplying strings, Built-in String methods and functions, Slice Operation, Iterating String, String Module."
                },
                "6": {
                    title: "Lists",
                    syllabus: "Lists: Creation of Lists, Indexing, Slicing, Updating Lists, List Methods, Iterating Lists, Nested Lists."
                },
                "7": {
                    title: "Tuples",
                    syllabus: "Tuples: Creating Tuples, Accessing Elements, Tuple Methods, differences between lists and tuples, immutability concept."
                },
                "8": {
                    title: "Functions",
                    syllabus: "Functions: Declaration, Definition, Variable Scope, Lifetime of Variables, Return Statements, Types of Arguments (positional, keyword, default, variable-length), Lambda function."
                },
                "9": {
                    title: "Recursion & Modules",
                    syllabus: "Recursion with examples like factorial and Fibonacci. Modules: Built-in Modules, User-defined Modules, importing and using modules."
                },
                "10": {
                    title: "GUI with Tkinter & Libraries",
                    syllabus: "Modules and Libraries: Tkinter basics - Labels, Buttons, Entry, Text, Frame, Menu, Simple GUI Applications. Basic Packages and Libraries overview."
                }
            },
            "Calculus & Differential Equations": {
                "1": {
                    title: "Limits and Continuity",
                    syllabus: "Limits of functions, one-sided limits, continuity of functions, types of discontinuities, Intermediate Value Theorem."
                },
                "2": {
                    title: "Optimization and Extrema",
                    syllabus: "Optimization and Extrema in Multivariable Calculus: local maxima, minima, saddle points, Lagrange multipliers."
                },
                "3": {
                    title: "Ordinary Differential Equations",
                    syllabus: "Introduction to Ordinary Differential Equations: formation, order, degree, solution methods for first-order ODEs."
                },
                "4": {
                    title: "Partial Derivatives",
                    syllabus: "Partial Derivatives: definition, computation, higher-order partial derivatives, chain rule for partial derivatives."
                },
                "5": {
                    title: "Multiple Integrals",
                    syllabus: "Double integrals, triple integrals, change of order of integration, applications to area and volume."
                },
                "6": {
                    title: "Vector Calculus",
                    syllabus: "Vector Calculus: gradient, divergence, curl, directional derivatives, vector identities."
                },
                "7": {
                    title: "Line Integrals",
                    syllabus: "Line integrals of scalar and vector fields, work done by a force, path independence."
                },
                "8": {
                    title: "Surface Integrals",
                    syllabus: "Surface integrals of scalar and vector fields, flux through a surface."
                },
                "9": {
                    title: "Green's Theorem",
                    syllabus: "Green's Theorem: statement, proof, applications to area calculation and line integrals."
                },
                "10": {
                    title: "Stokes' Theorem",
                    syllabus: "Stokes' Theorem: statement and applications relating surface integrals and line integrals."
                }
            },
            "Physics": {
                "1": { title: "Classical Mechanics", syllabus: "Newton's laws of motion, momentum, work, energy, conservation laws, rotational motion." },
                "2": { title: "Electromagnetism", syllabus: "Electric fields, magnetic fields, Coulomb's law, Gauss's law, Faraday's law, Maxwell's equations." },
                "3": { title: "Optics", syllabus: "Reflection, refraction, lenses, mirrors, interference, diffraction, polarization of light." },
                "4": { title: "Thermodynamics", syllabus: "Laws of thermodynamics, heat engines, entropy, Carnot cycle, ideal gases." },
                "5": { title: "Quantum Mechanics Intro", syllabus: "Wave-particle duality, Heisenberg uncertainty principle, Schrödinger equation, quantum numbers." },
                "6": { title: "Solid State Physics", syllabus: "Crystal structures, band theory, semiconductors, conductors, insulators." },
                "7": { title: "Relativity", syllabus: "Special theory of relativity, time dilation, length contraction, mass-energy equivalence E=mc²." },
                "8": { title: "Nuclear Physics", syllabus: "Nuclear structure, radioactive decay, fission, fusion, nuclear reactions." },
                "9": { title: "Particle Physics", syllabus: "Elementary particles, Standard Model, quarks, leptons, bosons, fundamental forces." },
                "10": { title: "Astrophysics Basics", syllabus: "Stars, stellar evolution, galaxies, Big Bang theory, dark matter and dark energy." }
            }
        },

        // ----- TERM 2 -----
        "2": {
            "Frontend Development": {
                "1": {
                    title: "JavaScript Basics & DOM Fundamentals",
                    syllabus: "Introduction to JavaScript: Variable Declaration (var, let, const), Data Types, Expressions, Operators, Control Statements: Conditional Statements, Switch Statement. DOM and Event Fundamentals: DOM Tree, DOM Methods, onclick Event."
                },
                "2": {
                    title: "DOM Manipulations & Arrays",
                    syllabus: "More Document Object Model Manipulations. JS Concepts: Loops. Array Methods: push(), pop(), splice(), findIndex(), includes(), and more String manipulation methods."
                },
                "3": {
                    title: "JS Objects & Functions",
                    syllabus: "Objects: Creation, Accessing, Destructuring, Modifying, Spread Operator, Rest Parameter. Functions: Function Declaration, Expressions, Arrow Functions, Callback Functions, Schedulers."
                },
                "4": {
                    title: "Event Listeners & HTTP Basics",
                    syllabus: "Events: Event Handlers, Event Listeners, Event Object, Keyboard Events. HTTP Basics: Protocols, HTTP Requests, Fetch API, Introduction to JSON, JSON Methods."
                },
                "5": {
                    title: "Form Handling & Events",
                    syllabus: "Events: Event Object Methods, preventDefault. Form Handling: Form Events, Basic Error Handling, Building a complete HTML form with JavaScript validation."
                },
                "6": {
                    title: "JS Functions & Mutability",
                    syllabus: "JS Functions: Factory function, Constructor function, Function Properties, Built-in Constructor Functions, Date Constructor Functions, the 'this' keyword. Mutability: Immutable and Mutable Values in JavaScript."
                },
                "7": {
                    title: "JS Behind the Scenes & Event Loop",
                    syllabus: "JavaScript Execution Model: JS Engine internals, Call Stack, Task Queues, Microtask Queue, Event Loop mechanism and how asynchronous code runs."
                },
                "8": {
                    title: "JS Classes & Promises",
                    syllabus: "JS Classes: Class declaration, Inheritance with extends. JS Promises: Promise States (pending, fulfilled, rejected), Consuming Promises with .then()/.catch(), Async/Await syntax."
                },
                "9": {
                    title: "Array Methods & Hoisting",
                    syllabus: "JS Concepts: Hoisting of variables and functions, Clean Code Guidelines. Array Methods: map(), reduce(), filter(), and distinction between Mutable and Immutable array methods."
                },
                "10": {
                    title: "Node.js & JS Modules",
                    syllabus: "Running JavaScript Locally: Node JS introduction, Running JavaScript Using Node JS, CommonJS Module Exports (require/module.exports), Modern ES Module Exports (import/export). Node Packages: Core Modules, Node Package Manager (npm), Third-party Packages."
                }
            },
            "Data Structures": {
                "1": { title: "Arrays and Linked Lists", syllabus: "Array operations, singly and doubly linked lists, insertion, deletion, traversal." },
                "2": { title: "Stacks and Queues", syllabus: "Stack (LIFO) operations, Queue (FIFO) operations, circular queue, deque, applications." },
                "3": { title: "Trees and Binary Search Trees", syllabus: "Tree terminology, binary trees, BST operations, tree traversals (inorder, preorder, postorder)." },
                "4": { title: "Heaps and Priority Queues", syllabus: "Min-heap, max-heap, heapify, heap sort, priority queue implementation." },
                "5": { title: "Graphs and Traversal", syllabus: "Graph representations (adjacency matrix, list), BFS, DFS, applications of graph traversal." },
                "6": { title: "Sorting Algorithms", syllabus: "Bubble sort, selection sort, insertion sort, merge sort, quick sort with time complexity analysis." },
                "7": { title: "Searching Algorithms", syllabus: "Linear search, binary search, interpolation search, and their time complexities." },
                "8": { title: "Hashing", syllabus: "Hash functions, hash tables, collision resolution: chaining and open addressing." },
                "9": { title: "Advanced Trees (AVL, Red-Black)", syllabus: "AVL trees: rotations and balancing. Red-Black trees: properties, insertion, deletion." },
                "10": { title: "Algorithm Complexity", syllabus: "Big-O, Big-Theta, Big-Omega notations, time and space complexity analysis, P vs NP." }
            },
            "Mathematics-II": {
                "1": { title: "Linear Algebra", syllabus: "Matrices, determinants, systems of linear equations, Gaussian elimination." },
                "2": { title: "Eigenvalues and Eigenvectors", syllabus: "Characteristic equation, eigenvalues, eigenvectors, diagonalization." },
                "3": { title: "Vector Spaces", syllabus: "Vector spaces, subspaces, basis, dimension, linear independence." },
                "4": { title: "Complex Analysis", syllabus: "Complex numbers, analytic functions, Cauchy-Riemann equations, contour integration." },
                "5": { title: "Probability Theory", syllabus: "Sample space, events, probability axioms, conditional probability, Bayes' theorem." },
                "6": { title: "Statistics", syllabus: "Measures of central tendency, variance, standard deviation, distributions, hypothesis testing." },
                "7": { title: "Numerical Methods", syllabus: "Bisection method, Newton-Raphson, numerical integration: trapezoidal and Simpson's rules." },
                "8": { title: "Fourier Series", syllabus: "Fourier series representation, Euler's formulas, half-range expansions." },
                "9": { title: "Laplace Transforms", syllabus: "Laplace transform, inverse Laplace, solving ODEs using Laplace transforms." },
                "10": { title: "Z-Transforms", syllabus: "Z-transform definition, properties, inverse Z-transform, applications in signal processing." }
            }
        },

        // ----- TERM 3 -----
        "3": {
            "Database Management Systems": {
                "1": { title: "Intro to DBMS", syllabus: "Database concepts, advantages over file systems, DBMS architecture, data abstraction levels." },
                "2": { title: "ER Modeling", syllabus: "Entity-Relationship model, entities, attributes, relationships, ER diagram notation." },
                "3": { title: "Relational Model", syllabus: "Relational model concepts, keys (primary, foreign, candidate), relational algebra operations." },
                "4": { title: "SQL Basics", syllabus: "DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), basic queries, WHERE clause." },
                "5": { title: "Advanced SQL", syllabus: "Joins (INNER, LEFT, RIGHT, FULL), subqueries, aggregate functions (COUNT, SUM, AVG), GROUP BY, HAVING." },
                "6": { title: "Normalization", syllabus: "Functional dependencies, 1NF, 2NF, 3NF, BCNF — definitions, examples, and decomposition." },
                "7": { title: "Transaction Management", syllabus: "ACID properties, transaction states, concurrency problems, serializability." },
                "8": { title: "Concurrency Control", syllabus: "Lock-based protocols, two-phase locking, timestamp ordering, deadlock handling." },
                "9": { title: "Database Security", syllabus: "Authentication, authorization, SQL injection, encryption, access control mechanisms." },
                "10": { title: "NoSQL Databases", syllabus: "NoSQL types (document, key-value, column, graph), CAP theorem, MongoDB basics vs SQL." }
            }
        },

        // ----- TERM 4 -----
        "4": {
            "Operating Systems": {
                "1": { title: "Introduction to OS", syllabus: "OS definition, goals, types (batch, time-sharing, real-time), OS structure and services." },
                "2": { title: "Process Management", syllabus: "Process concept, process states, PCB, context switching, process creation and termination." },
                "3": { title: "CPU Scheduling", syllabus: "Scheduling criteria, algorithms: FCFS, SJF, Round Robin, Priority Scheduling, Multilevel Queue." },
                "4": { title: "Process Synchronization", syllabus: "Critical section problem, mutex, semaphores, monitors, classical problems (Producer-Consumer, Readers-Writers)." },
                "5": { title: "Deadlocks", syllabus: "Deadlock conditions, resource allocation graph, prevention, avoidance (Banker's algorithm), detection and recovery." },
                "6": { title: "Memory Management", syllabus: "Memory allocation, paging, segmentation, fragmentation, address translation." },
                "7": { title: "Virtual Memory", syllabus: "Demand paging, page faults, page replacement algorithms (FIFO, LRU, Optimal)." },
                "8": { title: "File Systems", syllabus: "File concepts, directory structures, file allocation methods (contiguous, linked, indexed)." },
                "9": { title: "I/O Systems", syllabus: "I/O hardware, polling, interrupts, DMA, disk scheduling algorithms (FCFS, SSTF, SCAN)." },
                "10": { title: "Security & Protection", syllabus: "Security threats, authentication mechanisms, access control lists, encryption basics." }
            }
        }
    },

    // =========================================================
    //  YEAR II
    // =========================================================
    "II": {
        "1": {
            "Computer Networks": {
                "1": { title: "Introduction to Networks", syllabus: "Network types (LAN, WAN, MAN), topologies, OSI model layers, TCP/IP model overview." },
                "2": { title: "Physical & Data Link Layer", syllabus: "Transmission media, encoding, framing, error detection (CRC, checksum), flow control (sliding window)." },
                "3": { title: "Network Layer", syllabus: "IP addressing (IPv4, IPv6), subnetting, routing algorithms (Dijkstra, Bellman-Ford), CIDR." },
                "4": { title: "Transport Layer", syllabus: "TCP vs UDP, connection establishment (3-way handshake), flow control, congestion control." },
                "5": { title: "Application Layer", syllabus: "HTTP, HTTPS, FTP, SMTP, DNS, DHCP protocols and their working." },
                "6": { title: "Network Security Basics", syllabus: "Firewalls, VPN, SSL/TLS, symmetric and asymmetric encryption, digital certificates." },
                "7": { title: "Wireless Networks", syllabus: "IEEE 802.11 (WiFi), Bluetooth, cellular networks, mobile IP, wireless security." },
                "8": { title: "Socket Programming", syllabus: "Client-server model, TCP sockets, UDP sockets, simple socket programs in Python/Java." },
                "9": { title: "Network Devices", syllabus: "Hubs, switches, routers, bridges, gateways — working principles and differences." },
                "10": { title: "Cloud & SDN Basics", syllabus: "Cloud computing models (IaaS, PaaS, SaaS), Software Defined Networking introduction." }
            }
        },
        "2": {
            "Web Development": {
                "1": { title: "HTML5 Fundamentals", syllabus: "HTML5 semantic elements, forms, tables, media elements (audio, video), accessibility." },
                "2": { title: "CSS3 & Responsive Design", syllabus: "CSS selectors, box model, Flexbox, CSS Grid, media queries, responsive web design principles." },
                "3": { title: "React Basics", syllabus: "React introduction, JSX, components (functional, class), props, state, rendering." },
                "4": { title: "React Hooks", syllabus: "useState, useEffect, useContext, useRef, custom hooks, rules of hooks." },
                "5": { title: "React Router & State Management", syllabus: "React Router for navigation, Redux basics: store, actions, reducers, useSelector, useDispatch." },
                "6": { title: "Backend with Node.js", syllabus: "Node.js runtime, Express.js framework, middleware, REST API creation, routing." },
                "7": { title: "Database Integration", syllabus: "Connecting Node.js to MongoDB (Mongoose) and MySQL, CRUD operations via API." },
                "8": { title: "Authentication & Authorization", syllabus: "JWT tokens, bcrypt for password hashing, session management, OAuth basics." },
                "9": { title: "API Development", syllabus: "RESTful API design principles, status codes, Postman testing, API documentation with Swagger." },
                "10": { title: "Deployment & DevOps Basics", syllabus: "Git, GitHub, deployment to Vercel/Netlify/Heroku, CI/CD basics, environment variables." }
            }
        },
        "3": {
            "Software Engineering": {
                "1": { title: "Software Development Life Cycle", syllabus: "SDLC phases, Waterfall model, Agile methodology, Scrum framework, Kanban." },
                "2": { title: "Requirements Engineering", syllabus: "Functional and non-functional requirements, use case diagrams, user stories, SRS document." },
                "3": { title: "System Design", syllabus: "High-level design, low-level design, UML diagrams: class, sequence, activity, state diagrams." },
                "4": { title: "Design Patterns", syllabus: "Creational patterns (Singleton, Factory), Structural patterns (Adapter, Decorator), Behavioral patterns (Observer, Strategy)." },
                "5": { title: "Software Testing", syllabus: "Testing types (unit, integration, system, acceptance), black-box vs white-box, test cases, TDD." },
                "6": { title: "Code Quality & Reviews", syllabus: "Clean code principles, SOLID principles, code review process, static analysis tools." },
                "7": { title: "Project Management", syllabus: "Project planning, estimation techniques, risk management, Gantt charts, milestones." },
                "8": { title: "Configuration Management", syllabus: "Version control with Git (branching, merging, rebasing), CI/CD pipelines." },
                "9": { title: "Software Maintenance", syllabus: "Types of maintenance (corrective, adaptive, perfective), refactoring, technical debt." },
                "10": { title: "Software Quality Assurance", syllabus: "Quality models (ISO 9001, CMMI), metrics, software reliability, performance testing." }
            }
        },
        "4": {
            "Artificial Intelligence": {
                "1": { title: "Introduction to AI", syllabus: "AI history, definitions, Turing test, AI approaches (symbolic, connectionist), applications." },
                "2": { title: "Search Algorithms", syllabus: "Uninformed search (BFS, DFS, UCS), informed search (A*, greedy best-first), heuristics." },
                "3": { title: "Knowledge Representation", syllabus: "Propositional logic, first-order predicate logic, semantic networks, ontologies." },
                "4": { title: "Machine Learning Basics", syllabus: "Supervised, unsupervised, reinforcement learning, training/testing split, overfitting, underfitting." },
                "5": { title: "Regression & Classification", syllabus: "Linear regression, logistic regression, decision trees, k-NN algorithm with examples." },
                "6": { title: "Neural Networks", syllabus: "Perceptron, multi-layer neural networks, activation functions, backpropagation algorithm." },
                "7": { title: "Deep Learning", syllabus: "Convolutional Neural Networks (CNN), Recurrent Neural Networks (RNN), LSTM, applications." },
                "8": { title: "Natural Language Processing", syllabus: "Tokenization, stemming, lemmatization, bag of words, TF-IDF, sentiment analysis basics." },
                "9": { title: "Computer Vision", syllabus: "Image processing, feature extraction, object detection, image classification with CNNs." },
                "10": { title: "AI Ethics & Future Trends", syllabus: "Bias in AI, fairness, explainability, responsible AI, generative AI, large language models." }
            }
        }
    },

    // =========================================================
    //  YEAR III — Add your subjects here
    // =========================================================
    "III": {
        "1": {
            "Cloud Computing": {
                "1": { title: "Cloud Computing Fundamentals", syllabus: "Cloud definition, service models (IaaS, PaaS, SaaS), deployment models (public, private, hybrid, community)." },
                "2": { title: "Virtualization", syllabus: "Hypervisors (Type 1, Type 2), virtual machines, containers (Docker), benefits of virtualization." },
                "3": { title: "AWS Core Services", syllabus: "EC2 instances, S3 storage, IAM roles and policies, VPC networking basics, pricing models." },
                "4": { title: "Scalability & Load Balancing", syllabus: "Horizontal vs vertical scaling, auto-scaling, load balancers, CDN, high availability patterns." },
                "5": { title: "Serverless Computing", syllabus: "Function as a Service (FaaS), AWS Lambda, event-driven architecture, cold starts, use cases." },
                "6": { title: "Cloud Databases", syllabus: "Managed databases: RDS, DynamoDB, Firebase. ACID vs BASE, choosing SQL vs NoSQL in cloud." },
                "7": { title: "DevOps & CI/CD on Cloud", syllabus: "CI/CD pipelines with GitHub Actions, Jenkins, Docker containers, Kubernetes orchestration basics." },
                "8": { title: "Cloud Security", syllabus: "Shared responsibility model, identity and access management, encryption at rest and in transit, compliance." },
                "9": { title: "Microservices Architecture", syllabus: "Microservices vs monolith, API gateway, service mesh, inter-service communication (REST, gRPC, message queues)." },
                "10": { title: "Cloud Cost Optimization", syllabus: "Cost management tools, reserved instances, spot instances, tagging resources, cloud billing analysis." }
            }
        }
    },

    // =========================================================
    //  YEAR IV — Add your subjects here
    // =========================================================
    "IV": {
        "1": {
            "Capstone Project": {
                "1": { title: "Project Ideation & Problem Statement", syllabus: "Identifying real-world problems, writing a clear problem statement, feasibility analysis, project scope definition." },
                "2": { title: "Literature Review & Research", syllabus: "Reviewing existing solutions, identifying research gaps, documenting references, preparing a literature survey." },
                "3": { title: "System Requirements & Design", syllabus: "Gathering functional requirements, creating system architecture diagrams, database schema design." },
                "4": { title: "Prototype Development", syllabus: "Building a working prototype, wireframing, choosing tech stack, iterative development approach." },
                "5": { title: "Frontend Implementation", syllabus: "Developing the user interface, responsive design, user experience considerations, UI testing." },
                "6": { title: "Backend Implementation", syllabus: "Server-side development, API design and integration, database connections, authentication." },
                "7": { title: "Testing & Debugging", syllabus: "Writing test cases, unit testing, integration testing, debugging tools, fixing bugs." },
                "8": { title: "Deployment & Documentation", syllabus: "Deploying the project to cloud, writing technical documentation, user manuals, API docs." },
                "9": { title: "Project Review & Optimization", syllabus: "Performance profiling, code optimization, security review, peer feedback incorporation." },
                "10": { title: "Final Presentation & Viva", syllabus: "Preparing project presentation, demonstrating the project, answering viva questions, project report finalization." }
            }
        }
    }
};

// Default fallback topic (used if data is missing)
const DEFAULT_TOPIC = "Weekly Technical Review and Insights";