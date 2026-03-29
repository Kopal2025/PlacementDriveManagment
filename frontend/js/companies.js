const table  = document.getElementById("tableBody");
const search = document.getElementById("search");

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function render(data) {
    table.innerHTML = "";
    data.forEach(c => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.industry)}</td>
            <td>${escapeHtml(c.hr)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.contact)}</td>
        `;
        table.appendChild(row);
    });
    document.getElementById("totalCompanies").innerText = PDMS.getCompanies().length;
}

function filterData() {
    const q = search.value.toLowerCase().trim();
    const all = PDMS.getCompanies();
    render(q ? all.filter(c => c.name.toLowerCase().includes(q)) : all);
}

async function addCompany() {
    const name    = document.getElementById("name").value.trim();
    const industry= document.getElementById("industry").value.trim();
    const hr      = document.getElementById("hr").value.trim();
    const email   = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();

    if (!name || !industry || !hr || !email || !contact) {
        alert("Fill all fields."); return;
    }

    const res = await PDMS.saveCompanyAdd({ name, industry, hr, email, contact });
    if (!res.ok) { alert("Error: " + res.error); return; }

    ["name","industry","hr","email","contact"].forEach(id => document.getElementById(id).value = "");
    filterData();
}

search.addEventListener("input", filterData);

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

// Wait for PDMS.loadAll() then render
(async () => {
    await PDMS.loadAll();
    filterData();
})();
