/**
 * Shared client-side store (localStorage) — aligns with PDMS schema until backend exists.
 */
(function () {
    const KEYS = {
        students: "pdms_students",
        companies: "pdms_companies",
        drives: "pdms_drives",
        applications: "pdms_applications",
        results: "pdms_results",
        skills: "pdms_student_skills",
    };

    /** Bump when sample dataset changes so users get fresh seed */
    const SEED_VERSION = "5";

    function uid(prefix) {
        return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function eligiblePair(student, drive) {
        if (!student || !drive) return false;
        const cgpaOk = Number(student.cgpa) >= Number(drive.minCgpa);
        const b1 = String(student.branch).trim().toLowerCase();
        const b2 = String(drive.branch).trim().toLowerCase();
        return cgpaOk && b1 === b2;
    }

    function shuffle(arr, rnd) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function mulberry32(seed) {
        return function () {
            let t = (seed += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function buildFullSeed() {
        const rnd = mulberry32(20260328);

        const companyNames = [
            ["Google", "Tech", "Priya S", "hr@google-pdms.com", "9800010001"],
            ["Microsoft", "Tech", "Rahul K", "hr@microsoft-pdms.com", "9800010002"],
            ["Amazon", "E-Commerce", "Neha R", "hr@amazon-pdms.com", "9800010003"],
            ["Meta", "Social", "Amit V", "hr@meta-pdms.com", "9800010004"],
            ["Apple", "Hardware", "Sara M", "hr@apple-pdms.com", "9800010005"],
            ["Adobe", "Software", "Kiran L", "hr@adobe-pdms.com", "9800010006"],
            ["Oracle", "Enterprise", "Divya N", "hr@oracle-pdms.com", "9800010007"],
            ["SAP", "ERP", "Vikram P", "hr@sap-pdms.com", "9800010008"],
            ["Salesforce", "Cloud", "Megha T", "hr@salesforce-pdms.com", "9800010009"],
            ["IBM", "IT Services", "Arun J", "hr@ibm-pdms.com", "9800010010"],
            ["Infosys", "IT Services", "Pooja D", "hr@infosys-pdms.com", "9800010011"],
            ["TCS", "IT Services", "Suresh G", "hr@tcs-pdms.com", "9800010012"],
            ["Wipro", "IT Services", "Anita B", "hr@wipro-pdms.com", "9800010013"],
            ["Cognizant", "IT Services", "Ravi H", "hr@cognizant-pdms.com", "9800010014"],
            ["Accenture", "Consulting", "Nisha F", "hr@accenture-pdms.com", "9800010015"],
        ];

        const companies = companyNames.map((row, i) => ({
            id: "c_seed_" + i,
            name: row[0],
            industry: row[1],
            hr: row[2],
            email: row[3],
            contact: row[4],
        }));

        const firstNames = [
            "Aarav", "Vihaan", "Aditya", "Arjun", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Advik", "Dhruv",
            "Ananya", "Diya", "Ira", "Kavya", "Meera", "Neha", "Pooja", "Riya", "Saanvi", "Tara",
            "Rohan", "Karan", "Manav", "Nikhil", "Omkar", "Pranav", "Ritvik", "Siddharth", "Tanish", "Varun",
            "Bhavya", "Charvi", "Esha", "Gauri", "Harshita", "Ishita", "Juhi", "Komal", "Lavanya", "Mitali",
            "Naveen", "Ojas", "Parth", "Qadir", "Raghav", "Sahil", "Tejas", "Uday", "Vedant", "Yash",
            "Zara", "Aisha", "Bina", "Chitra", "Deepa", "Fatima", "Gita", "Hema", "Indu", "Jaya",
            "Kiran", "Lalit", "Mohan", "Nitin", "Om", "Pankaj", "Ravi", "Sunil", "Tarun", "Umesh",
            "Vikas", "Yamini", "Zubin", "Aman", "Bharat", "Chetan", "Dev", "Ekta", "Farah",
        ];

        const lastNames = [
            "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Menon", "Kapoor", "Malhotra", "Bansal",
            "Gupta", "Singh", "Kumar", "Das", "Roy", "Ghosh", "Bose", "Sen", "Pillai", "Kulkarni",
            "Desai", "Shah", "Joshi", "Mehta", "Agarwal", "Chopra", "Sethi", "Khanna", "Bhatia", "Grover",
        ];

        const branches = ["CSE", "IT", "ECE", "ME", "CE", "AI", "DS"];
        const students = [];
        for (let i = 0; i < 75; i++) {
            const fn = firstNames[i % firstNames.length];
            const ln = lastNames[Math.floor(rnd() * lastNames.length)];
            const name = fn + " " + ln;
            const reg = "26PDM" + String(i + 1).padStart(3, "0");
            const branch = branches[i % branches.length];
            const cgpa = Math.round((5.5 + rnd() * 4.3) * 100) / 100;
            const year = 2024 + (i % 3);
            const phone = "98" + String(10000000 + i).slice(-8);
            const email = "s" + String(i + 1).padStart(3, "0") + "@student.mitpdms.edu";
            const backlog = rnd() > 0.92 ? "Yes" : "No";
            students.push({ reg, name, email, branch, cgpa, year, phone, backlog });
        }

        const roles = [
            "Software Engineer",
            "SDE II",
            "Data Analyst",
            "ML Engineer",
            "DevOps Engineer",
            "QA Engineer",
            "Product Engineer",
            "Consultant",
            "Systems Engineer",
            "Full Stack Developer",
            "Backend Engineer",
            "Frontend Engineer",
            "Cloud Engineer",
            "Security Analyst",
            "Business Analyst",
            "Research Engineer",
            "Firmware Engineer",
            "Hardware Engineer",
            "Network Engineer",
            "Database Admin",
            "Technical Lead",
            "Associate Engineer",
            "Graduate Trainee",
            "Intern (PPO)",
            "Senior Analyst",
        ];

        const drives = [];
        for (let i = 0; i < 25; i++) {
            const co = companies[i % companies.length];
            const branch = branches[i % branches.length];
            const minCgpa = Math.round((6 + (i % 5) * 0.4 + rnd() * 0.5) * 100) / 100;
            const pkg = Math.round((4 + rnd() * 35) * 10) / 10;
            const month = 1 + (i % 11);
            const day = 5 + (i % 20);
            drives.push({
                id: "d_seed_" + i,
                companyId: co.id,
                role: roles[i % roles.length],
                package: pkg,
                date: "2026-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0"),
                venue: "Venue " + String.fromCharCode(65 + (i % 5)),
                minCgpa: Math.min(9.5, Math.max(6, minCgpa)),
                branch,
                status: i % 8 === 0 ? "Closed" : "Open",
            });
        }

        const pairs = [];
        for (const d of drives) {
            for (const s of students) {
                if (eligiblePair(s, d)) {
                    pairs.push({ student: s, drive: d });
                }
            }
        }
        const shuffled = shuffle(pairs, rnd);
        const applications = [];
        const seen = new Set();
        const appStatuses = ["Applied", "Applied", "Shortlisted", "Selected", "Rejected", "Applied"];
        function takeApps(source) {
            for (const p of source) {
                if (applications.length >= 100) return;
                const key = p.student.reg + "|" + p.drive.id;
                if (seen.has(key)) continue;
                seen.add(key);
                applications.push({
                    id: "a_seed_" + applications.length,
                    studentReg: p.student.reg,
                    driveId: p.drive.id,
                    status: appStatuses[applications.length % appStatuses.length],
                });
            }
        }
        takeApps(shuffled);
        if (applications.length < 100) {
            takeApps(shuffle(pairs, rnd));
        }

        const offerStatuses = ["Accepted", "Rejected", "Pending"];
        const results = [];
        for (let i = 0; i < 30; i++) {
            const s = students[i % 10];
            const c = companies[(i + i % 7) % companies.length];
            results.push({
                id: "r_seed_" + i,
                studentReg: s.reg,
                companyId: c.id,
                package: Math.round((5 + rnd() * 30) * 10) / 10,
                status: offerStatuses[i % 3],
            });
        }

        const skillPool = [
            "Java",
            "Python",
            "C++",
            "SQL",
            "React",
            "Node",
            "AWS",
            "Docker",
            "ML",
            "DSA",
            "Spring",
            "Angular",
            "Kubernetes",
            "Git",
            "Linux",
        ];
        const skills = [];
        students.forEach((st, idx) => {
            const n = 1 + (idx % 4);
            for (let k = 0; k < n; k++) {
                const sk = skillPool[(idx + k * 3) % skillPool.length];
                skills.push({ reg: st.reg, skill: sk });
            }
        });

        return { companies, students, drives, applications, results, skills };
    }

    function ensureSeeded() {
        const ver = localStorage.getItem("pdms_seed_version");
        if (ver === SEED_VERSION && localStorage.getItem(KEYS.companies)) {
            return;
        }

        const bundle = buildFullSeed();
        localStorage.setItem(KEYS.companies, JSON.stringify(bundle.companies));
        localStorage.setItem(KEYS.students, JSON.stringify(bundle.students));
        localStorage.setItem(KEYS.drives, JSON.stringify(bundle.drives));
        localStorage.setItem(KEYS.applications, JSON.stringify(bundle.applications));
        localStorage.setItem(KEYS.results, JSON.stringify(bundle.results));
        localStorage.setItem(KEYS.skills, JSON.stringify(bundle.skills));
        localStorage.setItem("pdms_seed_version", SEED_VERSION);
    }

    function getCompanies() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.companies)) || [];
    }

    function saveCompanies(list) {
        localStorage.setItem(KEYS.companies, JSON.stringify(list));
    }

    function getStudents() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.students)) || [];
    }

    function saveStudents(list) {
        localStorage.setItem(KEYS.students, JSON.stringify(list));
    }

    function getDrives() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.drives)) || [];
    }

    function saveDrives(list) {
        localStorage.setItem(KEYS.drives, JSON.stringify(list));
    }

    function getApplications() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.applications)) || [];
    }

    function saveApplications(list) {
        localStorage.setItem(KEYS.applications, JSON.stringify(list));
    }

    function getResults() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.results)) || [];
    }

    function saveResults(list) {
        localStorage.setItem(KEYS.results, JSON.stringify(list));
    }

    function getSkills() {
        ensureSeeded();
        return JSON.parse(localStorage.getItem(KEYS.skills)) || [];
    }

    function saveSkills(list) {
        localStorage.setItem(KEYS.skills, JSON.stringify(list));
    }

    function companyById(id) {
        return getCompanies().find((c) => c.id === id);
    }

    function studentByReg(reg) {
        return getStudents().find((s) => s.reg === reg);
    }

    function driveById(id) {
        return getDrives().find((d) => d.id === id);
    }

    function branchesMatch(studentBranch, eligibleBranch) {
        return String(studentBranch).trim().toLowerCase() === String(eligibleBranch).trim().toLowerCase();
    }

    function isEligibleForDrive(student, drive) {
        if (!student || !drive) return false;
        const cgpaOk = Number(student.cgpa) >= Number(drive.minCgpa);
        const branchOk = branchesMatch(student.branch, drive.branch);
        return cgpaOk && branchOk;
    }

    window.PDMS = {
        KEYS,
        uid,
        getCompanies,
        saveCompanies,
        getStudents,
        saveStudents,
        getDrives,
        saveDrives,
        getApplications,
        saveApplications,
        getResults,
        saveResults,
        getSkills,
        saveSkills,
        companyById,
        studentByReg,
        driveById,
        branchesMatch,
        isEligibleForDrive,
    };
})();
