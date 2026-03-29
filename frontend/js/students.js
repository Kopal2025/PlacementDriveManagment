const table       = document.getElementById("tableBody");
const search      = document.getElementById("search");
const cgpaMinInput= document.getElementById("cgpaMin");

let skillStudentCombo;

function getMinCgpaFilter() {
    const v = cgpaMinInput.value.trim();
    if (v === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}

function getFilteredStudents() {
    let list = PDMS.getStudents();
    const q = search.value.trim().toLowerCase();
    const minCgpa = getMinCgpaFilter();
    if (q)       list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.reg).toLowerCase().includes(q));
    if (minCgpa !== null) list = list.filter(s => Number(s.cgpa) >= minCgpa);
    return list;
}

function skillsByReg(reg) {
    return PDMS.getSkills().filter(x => x.reg === reg);
}

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function capitalizeSkill(s) {
    const t = s.trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function initSkillStudentCombo() {
    const root = document.getElementById("skillStudentCombo");
    if (!root) return;
    skillStudentCombo = Combo.init(root, {
        getItems: () => getFilteredStudents(),
        getValue: s => s.reg,
        getLabel: s => `${s.name} (${s.reg})`,
        filter: (q, s) => {
            const qq = q.trim().toLowerCase();
            return !qq || s.name.toLowerCase().includes(qq) || String(s.reg).toLowerCase().includes(qq);
        },
        maxSuggestions: 50,
    });
}

function render(data) {
    table.innerHTML = "";
    data.forEach(s => {
        const row = document.createElement("tr");
        const skills = skillsByReg(s.reg);
        const tags = skills.length === 0
            ? '<span class="muted">—</span>'
            : skills.map(x => `<span class="skill-tag">${escapeHtml(x.skill)}</span>`).join(" ");

        row.innerHTML = `
            <td>${escapeHtml(s.reg)}</td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.branch)}</td>
            <td><strong>${Number(s.cgpa).toFixed(2)}</strong></td>
            <td>${escapeHtml(s.email)}</td>
            <td class="skills-cell-wrap">${tags}</td>
            <td class="actions-cell"></td>
        `;

        // skill remove buttons
        const skillsCell = row.querySelector(".skills-cell-wrap");
        skills.forEach(entry => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "link-btn skill-remove-btn";
            b.textContent = "× " + entry.skill;
            b.title = "Remove " + entry.skill;
            b.addEventListener("click", () => removeSkill(entry.reg, entry.skill));
            skillsCell.appendChild(b);
        });

        // delete student button
        const actionsCell = row.querySelector(".actions-cell");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "danger-btn";
        btn.textContent = "Remove student";
        btn.addEventListener("click", () => deleteStudent(s.reg));
        actionsCell.appendChild(btn);

        table.appendChild(row);
    });

    document.getElementById("totalStudents").innerText = PDMS.getStudents().length;
    document.getElementById("eligibleStudents").innerText = data.length;

    if (skillStudentCombo) skillStudentCombo.refresh();
}

async function deleteStudent(reg) {
    if (!confirm("Remove this student and all their related data?")) return;
    const res = await PDMS.saveStudentDelete(reg);
    if (!res.ok) { alert("Error: " + res.error); return; }
    filterData();
}

async function removeSkill(reg, skill) {
    const res = await PDMS.saveSkillDelete(reg, skill);
    if (!res.ok) { alert("Error: " + res.error); return; }
    filterData();
}

async function addSkill() {
    const reg   = skillStudentCombo ? skillStudentCombo.getValue() : "";
    let   skill = document.getElementById("skillName").value.trim();
    if (!reg || !skill) { alert("Select a student and enter a skill name."); return; }
    skill = capitalizeSkill(skill);

    const exists = PDMS.getSkills().some(x => x.reg === reg && x.skill.toLowerCase() === skill.toLowerCase());
    if (exists) { alert("Skill already listed for this student."); return; }

    const res = await PDMS.saveSkillAdd(reg, skill);
    if (!res.ok) { alert("Error: " + res.error); return; }
    document.getElementById("skillName").value = "";
    filterData();
}

async function addStudent() {
    const inputs = document.querySelectorAll(".add-student-box .form-grid input");
    const [regEl, nameEl, emailEl, branchEl, cgpaEl, yearEl, skillEl] = inputs;

    const reg    = regEl.value.trim();
    const name   = nameEl.value.trim();
    const email  = emailEl.value.trim();
    const branch = branchEl.value.trim();
    const cgpa   = parseFloat(cgpaEl.value);
    const year   = parseInt(yearEl.value, 10);

    if (!reg || !name || !email || !branch || isNaN(cgpa) || isNaN(year)) {
        alert("Please fill all fields correctly."); return;
    }
    if (cgpa < 0 || cgpa > 10)           { alert("CGPA must be 0–10."); return; }
    if (year < 2020 || year > 2099)      { alert("Enter a valid graduation year."); return; }
    if (PDMS.studentByReg(reg))          { alert("Registration number already exists."); return; }

    const res = await PDMS.saveStudentAdd({ reg, name, email, branch, cgpa, year, phone:"", backlog:"No" });
    if (!res.ok) { alert("Error: " + res.error); return; }
    inputs.forEach(i => i.value = "");
    filterData();
}

function filterData() { render(getFilteredStudents()); }

search.addEventListener("input", filterData);
cgpaMinInput.addEventListener("input", filterData);

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

(async () => {
    await PDMS.loadAll();
    initSkillStudentCombo();
    filterData();
})();
