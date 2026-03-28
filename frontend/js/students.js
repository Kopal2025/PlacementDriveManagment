const table = document.getElementById("tableBody");
const search = document.getElementById("search");
const cgpaMinInput = document.getElementById("cgpaMin");

let skillStudentCombo;

function getMinCgpaFilter() {
    const v = cgpaMinInput.value.trim();
    if (v === "") return null;
    const n = parseFloat(v);
    if (Number.isNaN(n)) return null;
    return n;
}

function getFilteredStudents() {
    let list = PDMS.getStudents();
    const q = search.value.trim().toLowerCase();
    const minCgpa = getMinCgpaFilter();

    if (q) {
        list = list.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                String(s.reg).toLowerCase().includes(q)
        );
    }
    if (minCgpa !== null) {
        list = list.filter((s) => Number(s.cgpa) >= minCgpa);
    }
    return list;
}

function skillsByReg(reg) {
    return PDMS.getSkills().filter((x) => x.reg === reg);
}

function capitalizeSkill(s) {
    const t = s.trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function initSkillStudentCombo() {
    const root = document.getElementById("skillStudentCombo");
    skillStudentCombo = Combo.init(root, {
        getItems: () => getFilteredStudents(),
        getValue: (s) => s.reg,
        getLabel: (s) => `${s.name} (${s.reg})`,
        filter: (q, s) => {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            return (
                s.name.toLowerCase().includes(qq) ||
                String(s.reg).toLowerCase().includes(qq)
            );
        },
        maxSuggestions: 50,
    });
}

function syncSkillComboAfterRender() {
    if (!skillStudentCombo) return;
    const v = skillStudentCombo.getValue();
    skillStudentCombo.refresh();
    if (v) {
        const list = getFilteredStudents();
        if (!list.some((s) => s.reg === v)) {
            skillStudentCombo.clear();
        } else {
            skillStudentCombo.setValue(v);
        }
    }
}

function render(data) {
    table.innerHTML = "";

    data.forEach((s) => {
        const row = document.createElement("tr");
        const skills = skillsByReg(s.reg);
        const tags =
            skills.length === 0
                ? '<span class="muted">—</span>'
                : skills
                      .map((x) => `<span class="skill-tag">${escapeHtml(x.skill)}</span>`)
                      .join(" ");

        row.innerHTML = `
            <td>${escapeHtml(s.reg)}</td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.branch)}</td>
            <td><strong>${Number(s.cgpa).toFixed(2)}</strong></td>
            <td>${escapeHtml(s.email)}</td>
            <td class="skills-cell-wrap">${tags}</td>
            <td class="actions-cell"></td>
        `;

        const skillsCell = row.querySelector(".skills-cell-wrap");
        if (skills.length > 0) {
            skills.forEach((entry) => {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "link-btn skill-remove-btn";
                b.textContent = "× " + entry.skill;
                b.title = "Remove " + entry.skill;
                b.addEventListener("click", () => removeSkill(entry.reg, entry.skill));
                skillsCell.appendChild(b);
            });
        }

        const actionsCell = row.querySelector(".actions-cell");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "danger-btn";
        btn.textContent = "Remove student";
        btn.addEventListener("click", () => window.deleteStudent(s.reg));
        actionsCell.appendChild(btn);

        table.appendChild(row);
    });

    const all = PDMS.getStudents();
    document.getElementById("totalStudents").innerText = all.length;
    document.getElementById("eligibleStudents").innerText = data.length;

    syncSkillComboAfterRender();
}

window.deleteStudent = function (reg) {
    if (!confirm("Remove this student? Related skills and applications should be cleaned in a full backend; here we remove the student and their skills.")) {
        return;
    }
    const students = PDMS.getStudents().filter((s) => s.reg !== reg);
    PDMS.saveStudents(students);

    const skills = PDMS.getSkills().filter((x) => x.reg !== reg);
    PDMS.saveSkills(skills);

    const apps = PDMS.getApplications().filter((a) => a.studentReg !== reg);
    PDMS.saveApplications(apps);

    const results = PDMS.getResults().filter((r) => r.studentReg !== reg);
    PDMS.saveResults(results);

    filterData();
};

function removeSkill(reg, skill) {
    const skills = PDMS.getSkills().filter((x) => !(x.reg === reg && x.skill === skill));
    PDMS.saveSkills(skills);
    filterData();
}

function addSkill() {
    const reg = skillStudentCombo ? skillStudentCombo.getValue() : "";
    let skill = document.getElementById("skillName").value.trim();
    if (!reg || !skill) {
        alert("Select a student and enter a skill name.");
        return;
    }
    skill = capitalizeSkill(skill);
    const exists = PDMS.getSkills().some((x) => x.reg === reg && x.skill.toLowerCase() === skill.toLowerCase());
    if (exists) {
        alert("This skill is already listed for the student.");
        return;
    }
    const skills = PDMS.getSkills();
    skills.push({ reg, skill });
    PDMS.saveSkills(skills);
    document.getElementById("skillName").value = "";
    filterData();
}

function addStudent() {
    const name = document.getElementById("name").value.trim();
    const reg = document.getElementById("reg").value.trim();
    const email = document.getElementById("email").value.trim();
    const branch = document.getElementById("branch").value.trim();
    const cgpa = parseFloat(document.getElementById("cgpa").value);
    const year = parseInt(document.getElementById("year").value, 10);
    const phone = document.getElementById("phone").value.trim();
    const backlogEl = document.getElementById("backlog");
    const backlog = backlogEl ? backlogEl.value : "No";

    if (!name || !reg || !email || !branch || !phone || !document.getElementById("cgpa").value || !document.getElementById("year").value) {
        alert("Please fill all fields.");
        return;
    }

    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        alert("CGPA must be between 0 and 10.");
        return;
    }

    if (year < 2020 || year > 2099) {
        alert("Graduation year must be at least 2020.");
        return;
    }

    if (backlog !== "Yes" && backlog !== "No") {
        alert("Invalid backlog status.");
        return;
    }

    const students = PDMS.getStudents();
    if (students.some((s) => s.reg === reg)) {
        alert("Registration number already exists.");
        return;
    }
    if (students.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
        alert("Email must be unique.");
        return;
    }
    if (students.some((s) => s.phone === phone)) {
        alert("Phone number must be unique.");
        return;
    }

    students.push({
        reg,
        name,
        email,
        branch,
        cgpa,
        year,
        phone,
        backlog,
    });
    PDMS.saveStudents(students);

    document.querySelectorAll(".add-student-form input").forEach((i) => (i.value = ""));
    const bl = document.getElementById("backlog");
    if (bl) bl.value = "No";

    filterData();
}

function filterData() {
    render(getFilteredStudents());
}

search.addEventListener("input", filterData);
cgpaMinInput.addEventListener("input", filterData);

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

initSkillStudentCombo();
filterData();
