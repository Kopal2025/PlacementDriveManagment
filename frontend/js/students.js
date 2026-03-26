const students = [
    { reg: "240911182", name: "Ankila Bajaj", email: "ankila@gmail.com", branch: "CSE", cgpa: 8.5, year: 2026, skills: "Java, SQL" },
    { reg: "240911224", name: "Kopal Gupta", email: "kopal@gmail.com", branch: "IT", cgpa: 7.2, year: 2026, skills: "Python, ML" },
    { reg: "240911692", name: "Bhavya Bhatia", email: "bhavya@gmail.com", branch: "ECE", cgpa: 9.1, year: 2026, skills: "C++, VLSI" },

    { reg: "240911101", name: "Rahul Sharma", email: "rahul@gmail.com", branch: "CSE", cgpa: 6.8, year: 2025, skills: "Java, DSA" },
    { reg: "240911102", name: "Priya Verma", email: "priya@gmail.com", branch: "IT", cgpa: 8.9, year: 2025, skills: "Python, AI" },
    { reg: "240911103", name: "Aman Singh", email: "aman@gmail.com", branch: "ECE", cgpa: 7.5, year: 2025, skills: "Embedded, C" },

    { reg: "240911104", name: "Sneha Kapoor", email: "sneha@gmail.com", branch: "CSE", cgpa: 9.3, year: 2026, skills: "React, Node" },
    { reg: "240911105", name: "Vikas Yadav", email: "vikas@gmail.com", branch: "ME", cgpa: 6.2, year: 2024, skills: "AutoCAD" },
    { reg: "240911106", name: "Neha Jain", email: "neha@gmail.com", branch: "IT", cgpa: 8.1, year: 2026, skills: "SQL, Power BI" },

    { reg: "240911107", name: "Arjun Mehta", email: "arjun@gmail.com", branch: "CSE", cgpa: 7.8, year: 2025, skills: "C++, DSA" },
    { reg: "240911108", name: "Pooja Nair", email: "pooja@gmail.com", branch: "ECE", cgpa: 9.0, year: 2026, skills: "VLSI, MATLAB" },
    { reg: "240911109", name: "Rohit Kumar", email: "rohit@gmail.com", branch: "CSE", cgpa: 6.5, year: 2024, skills: "Java, Spring" },

    { reg: "240911110", name: "Anjali Desai", email: "anjali@gmail.com", branch: "IT", cgpa: 8.7, year: 2025, skills: "Python, Data Science" },
    { reg: "240911111", name: "Karan Malhotra", email: "karan@gmail.com", branch: "ECE", cgpa: 7.1, year: 2026, skills: "Electronics, C" },
    { reg: "240911112", name: "Meera Iyer", email: "meera@gmail.com", branch: "CSE", cgpa: 9.5, year: 2026, skills: "Full Stack, React" },

    { reg: "240911113", name: "Siddharth Roy", email: "sid@gmail.com", branch: "IT", cgpa: 8.3, year: 2025, skills: "Cloud, AWS" },
    { reg: "240911114", name: "Tanya Gupta", email: "tanya@gmail.com", branch: "CSE", cgpa: 7.9, year: 2024, skills: "DSA, Java" },
    { reg: "240911115", name: "Harsh Patel", email: "harsh@gmail.com", branch: "ME", cgpa: 6.9, year: 2025, skills: "Mechanical Design" },

    { reg: "240911116", name: "Divya Reddy", email: "divya@gmail.com", branch: "ECE", cgpa: 8.6, year: 2026, skills: "Signal Processing" },
    { reg: "240911117", name: "Yash Agarwal", email: "yash@gmail.com", branch: "CSE", cgpa: 9.2, year: 2026, skills: "AI, ML" },
    { reg: "240911118", name: "Simran Kaur", email: "simran@gmail.com", branch: "IT", cgpa: 7.4, year: 2025, skills: "Networking" }
];

const table = document.getElementById("tableBody");
const search = document.getElementById("search");
const filter = document.getElementById("cgpaFilter");

// 🎯 Render Function
function render(data) {
    table.innerHTML = "";
    const cgpa = parseFloat(filter.value);

    data.forEach(s => {
        const row = document.createElement("tr");

        const isEligible = cgpa === 0 || s.cgpa >= cgpa;

        if (cgpa !== 0 && isEligible) {
            row.classList.add("eligible");
        }

        row.innerHTML = `
            <td>${s.reg}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td>${s.branch}</td>
            <td><strong>${s.cgpa}</strong></td>
            <td>${s.year}</td>
            <td>
                ${s.skills.split(",").map(skill => 
                    `<span class="skill-tag">${skill.trim()}</span>`
                ).join("")}
            </td>
            <td>
                ${cgpa !== 0 && isEligible ? '<span class="badge">Eligible</span>' : ''}
            </td>
        `;

        table.appendChild(row);
    });

    // ✅ Total always fixed
    document.getElementById("totalStudents").innerText = students.length;

    // ✅ Eligible FIXED (your requirement)
    let eligibleCount;
    if (cgpa === 0) {
        eligibleCount = students.length;   // 👈 IMPORTANT FIX
    } else {
        eligibleCount = students.filter(s => s.cgpa >= cgpa).length;
    }

    document.getElementById("eligibleStudents").innerText = eligibleCount;
}

// ➕ Add Student
function addStudent() {
    const name = document.getElementById("name").value;
    const reg = document.getElementById("reg").value;
    const email = document.getElementById("email").value;
    const branch = document.getElementById("branch").value;
    const cgpa = parseFloat(document.getElementById("cgpa").value);
    const year = document.getElementById("year").value;
    const skills = document.getElementById("skillsInput").value;

    if (!name || !reg || !email || !branch || !cgpa || !year || !skills) {
        alert("Please fill all fields");
        return;
    }

    students.push({ reg, name, email, branch, cgpa, year, skills });

    document.querySelectorAll(".form-grid input").forEach(i => i.value = "");

    render(students);
}

// 🔍 Filter
function filterData() {
    const q = search.value.toLowerCase();
    const cgpa = parseFloat(filter.value);

    const filtered = students.filter(s =>
        (s.name.toLowerCase().includes(q) || s.reg.includes(q)) &&
        (cgpa === 0 || s.cgpa >= cgpa)
    );

    render(filtered);
}

// Events
search.addEventListener("input", filterData);
filter.addEventListener("change", filterData);

// Sidebar
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

// Load
render(students);