const OFFER_STATUS_OPTIONS = [
    { value:"Accepted", label:"Accepted" },
    { value:"Rejected", label:"Rejected" },
    { value:"Pending",  label:"Pending"  },
];

let resultStudentCombo, resultCompanyCombo, resultStatusCombo;

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function countOffersPerStudent() {
    const c = {};
    PDMS.getResults().forEach(r => { c[r.studentReg] = (c[r.studentReg]||0) + 1; });
    return c;
}

function initResultCombos() {
    resultStudentCombo = Combo.init(document.getElementById("resultStudentCombo"), {
        getItems: () => PDMS.getStudents().slice().sort((a,b) => a.name.localeCompare(b.name)),
        getValue: s => s.reg,
        getLabel: s => `${s.name} (${s.reg})`,
        filter: (q,s) => { const qq=q.trim().toLowerCase(); return !qq||s.name.toLowerCase().includes(qq)||String(s.reg).toLowerCase().includes(qq); },
        maxSuggestions: 50,
    });

    resultCompanyCombo = Combo.init(document.getElementById("resultCompanyCombo"), {
        getItems: () => PDMS.getCompanies().slice().sort((a,b) => a.name.localeCompare(b.name)),
        getValue: c => c.id,
        getLabel: c => c.name,
        filter: (q,c) => { const qq=q.trim().toLowerCase(); return !qq||c.name.toLowerCase().includes(qq)||(c.industry||"").toLowerCase().includes(qq); },
        maxSuggestions: 50,
    });

    resultStatusCombo = Combo.init(document.getElementById("resultStatusCombo"), {
        getItems: () => OFFER_STATUS_OPTIONS,
        getValue: x => x.value,
        getLabel: x => x.label,
        filter: (q,x) => { const qq=q.trim().toLowerCase(); return !qq||x.label.toLowerCase().includes(qq); },
        maxSuggestions: 10,
    });
}

async function addResult() {
    const studentReg = resultStudentCombo ? resultStudentCombo.getValue() : "";
    const companyId  = resultCompanyCombo ? resultCompanyCombo.getValue() : "";
    const status     = resultStatusCombo  ? resultStatusCombo.getValue()  : "";
    const pkg        = parseFloat(document.getElementById("package").value);
    const message    = document.getElementById("message");
    message.textContent = ""; message.className = "";

    if (!studentReg || !companyId || !status) { message.textContent="Fill student, company, package and status."; message.style.color="#b91c1c"; return; }
    if (isNaN(pkg) || pkg <= 0)               { message.textContent="Package must be > 0."; message.style.color="#b91c1c"; return; }

    const res = await PDMS.saveResultAdd({ studentReg, companyId, package: pkg, status });
    if (!res.ok) { message.textContent = "Error: " + res.error; message.style.color="#b91c1c"; return; }

    message.textContent = "Result added."; message.style.color="#15803d";
    document.getElementById("package").value = "";
    resultStudentCombo.clear(); resultCompanyCombo.clear(); resultStatusCombo.clear();
    renderTable();
}

function renderTable() {
    const tbody     = document.getElementById("tableBody");
    const summaryEl = document.getElementById("resultsSummary");
    const searchEl  = document.getElementById("resultsSearch");
    const q         = (searchEl && searchEl.value.trim().toLowerCase()) || "";

    tbody.innerHTML = "";
    const allResults  = PDMS.getResults();
    const offerCounts = countOffersPerStudent();
    const multiN      = Object.values(offerCounts).filter(v => v > 1).length;

    const filtered = q ? allResults.filter(r => {
        const s = PDMS.studentByReg(r.studentReg);
        return s ? s.name.toLowerCase().includes(q) || String(s.reg).toLowerCase().includes(q)
                 : String(r.studentReg).toLowerCase().includes(q);
    }) : allResults.slice();

    if (summaryEl) {
        summaryEl.textContent = `Showing ${filtered.length} of ${allResults.length} results` +
            (q ? ` (search: "${searchEl.value.trim()}")` : "") +
            `. Students with multiple offers: ${multiN}.`;
    }

    filtered.forEach(r => {
        const student = PDMS.studentByReg(r.studentReg);
        const company = PDMS.companyById(r.companyId);
        const multi   = (offerCounts[r.studentReg]||0) > 1;
        const star    = multi ? ' <span class="multi-star" title="Multiple offers">⭐</span>' : "";

        let rowClass = "row-pending";
        if (r.status === "Accepted") rowClass = "row-accepted";
        else if (r.status === "Rejected") rowClass = "row-rejected";

        const row = document.createElement("tr");
        row.className = rowClass + (multi ? " multi-offer" : "");
        row.innerHTML = `
            <td>${escapeHtml(student ? student.name : r.studentReg)}${star}</td>
            <td>${escapeHtml(company ? company.name : r.companyId)}</td>
            <td>${escapeHtml(r.package)} LPA</td>
            <td>${escapeHtml(r.status)}</td>
        `;
        tbody.appendChild(row);
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

(async () => {
    await PDMS.loadAll();
    initResultCombos();
    const rs = document.getElementById("resultsSearch");
    if (rs) rs.addEventListener("input", renderTable);
    renderTable();
})();
