const OFFER_STATUS_OPTIONS = [
    { value: "Accepted", label: "Accepted" },
    { value: "Rejected", label: "Rejected" },
    { value: "Pending", label: "Pending" },
];

let resultStudentCombo;
let resultCompanyCombo;
let resultStatusCombo;

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function countOffersPerStudent() {
    const c = {};
    PDMS.getResults().forEach((r) => {
        c[r.studentReg] = (c[r.studentReg] || 0) + 1;
    });
    return c;
}

function multiOfferStudentCount() {
    const c = countOffersPerStudent();
    return Object.keys(c).filter((k) => c[k] > 1).length;
}

function resultMatchesSearch(r, q) {
    if (!q) return true;
    const s = PDMS.studentByReg(r.studentReg);
    if (!s) {
        return String(r.studentReg).toLowerCase().includes(q);
    }
    return (
        s.name.toLowerCase().includes(q) ||
        String(s.reg).toLowerCase().includes(q)
    );
}

function initResultCombos() {
    resultStudentCombo = Combo.init(document.getElementById("resultStudentCombo"), {
        getItems: () =>
            PDMS.getStudents().slice().sort((a, b) => a.name.localeCompare(b.name)),
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

    resultCompanyCombo = Combo.init(document.getElementById("resultCompanyCombo"), {
        getItems: () =>
            PDMS.getCompanies().slice().sort((a, b) => a.name.localeCompare(b.name)),
        getValue: (c) => c.id,
        getLabel: (c) => c.name,
        filter: (q, c) => {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            return (
                c.name.toLowerCase().includes(qq) ||
                (c.industry || "").toLowerCase().includes(qq)
            );
        },
        maxSuggestions: 50,
    });

    resultStatusCombo = Combo.init(document.getElementById("resultStatusCombo"), {
        getItems: () => OFFER_STATUS_OPTIONS,
        getValue: (x) => x.value,
        getLabel: (x) => x.label,
        filter: (q, x) => {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            return x.label.toLowerCase().includes(qq);
        },
        maxSuggestions: 10,
    });
}

function addResult() {
    const studentReg = resultStudentCombo ? resultStudentCombo.getValue() : "";
    const companyId = resultCompanyCombo ? resultCompanyCombo.getValue() : "";
    const status = resultStatusCombo ? resultStatusCombo.getValue() : "";
    const pkg = parseFloat(document.getElementById("package").value);
    const message = document.getElementById("message");

    message.textContent = "";
    message.className = "";

    if (!studentReg || !companyId || !status) {
        message.textContent = "Fill student, company, package, and offer status.";
        message.style.color = "#b91c1c";
        return;
    }

    if (Number.isNaN(pkg) || pkg <= 0) {
        message.textContent = "Package offered must be greater than 0.";
        message.style.color = "#b91c1c";
        return;
    }

    const results = PDMS.getResults();
    results.push({
        id: PDMS.uid("r"),
        studentReg,
        companyId,
        package: pkg,
        status,
    });
    PDMS.saveResults(results);

    message.textContent = "Result added.";
    message.style.color = "#15803d";

    document.getElementById("package").value = "";
    if (resultStudentCombo) resultStudentCombo.clear();
    if (resultCompanyCombo) resultCompanyCombo.clear();
    if (resultStatusCombo) resultStatusCombo.clear();

    renderTable();
}

function renderTable() {
    const table = document.getElementById("tableBody");
    const summaryEl = document.getElementById("resultsSummary");
    const searchEl = document.getElementById("resultsSearch");
    const q = (searchEl && searchEl.value.trim().toLowerCase()) || "";

    table.innerHTML = "";

    const allResults = PDMS.getResults();
    const offerCounts = countOffersPerStudent();
    const multiN = multiOfferStudentCount();

    const filtered = q ? allResults.filter((r) => resultMatchesSearch(r, q)) : allResults.slice();

    if (summaryEl) {
        summaryEl.textContent =
            `Showing ${filtered.length} of ${allResults.length} results` +
            (q ? ` (search: “${searchEl.value.trim()}”)` : "") +
            `. Students with multiple offers: ${multiN}. Rows with ⭐ = that student has more than one result in the full list.`;
    }

    filtered.forEach((r) => {
        const student = PDMS.studentByReg(r.studentReg);
        const company = PDMS.companyById(r.companyId);
        const studentLabel = student ? student.name : r.studentReg;
        const companyLabel = company ? company.name : r.companyId;
        const multi = (offerCounts[r.studentReg] || 0) > 1;

        let rowClass = "row-pending";
        if (r.status === "Accepted") rowClass = "row-accepted";
        else if (r.status === "Rejected") rowClass = "row-rejected";
        else if (r.status === "Pending") rowClass = "row-pending";

        const star = multi ? ' <span class="multi-star" title="This student has multiple offers">⭐</span>' : "";

        const row = document.createElement("tr");
        row.className = rowClass + (multi ? " multi-offer" : "");
        row.innerHTML = `
            <td>${escapeHtml(studentLabel)}${star}</td>
            <td>${escapeHtml(companyLabel)}</td>
            <td>${escapeHtml(r.package)} LPA</td>
            <td>${escapeHtml(r.status)}</td>
        `;
        table.appendChild(row);
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

initResultCombos();
const rs = document.getElementById("resultsSearch");
if (rs) {
    rs.addEventListener("input", renderTable);
}
renderTable();
