const table = document.getElementById("tableBody");
const search = document.getElementById("search");

function render(data) {
    table.innerHTML = "";

    data.forEach((c) => {
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

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function filterData() {
    const q = search.value.toLowerCase().trim();
    const all = PDMS.getCompanies();
    const filtered = q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
    render(filtered);
}

function addCompany() {
    const name = document.getElementById("name").value.trim();
    const industry = document.getElementById("industry").value.trim();
    const hr = document.getElementById("hr").value.trim();
    const email = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();

    if (!name || !industry || !hr || !email || !contact) {
        alert("Fill all fields.");
        return;
    }

    const companies = PDMS.getCompanies();
    if (companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        alert("Company name must be unique.");
        return;
    }
    if (companies.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
        alert("HR email must be unique.");
        return;
    }
    if (companies.some((c) => c.contact === contact)) {
        alert("Contact number must be unique.");
        return;
    }

    companies.push({
        id: PDMS.uid("c"),
        name,
        industry,
        hr,
        email,
        contact,
    });
    PDMS.saveCompanies(companies);

    document.getElementById("name").value = "";
    document.getElementById("industry").value = "";
    document.getElementById("hr").value = "";
    document.getElementById("email").value = "";
    document.getElementById("contact").value = "";

    filterData();
}

search.addEventListener("input", filterData);

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

filterData();
