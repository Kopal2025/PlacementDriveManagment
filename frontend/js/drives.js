const driveTable = document.getElementById("driveTable");
const eligibleTable = document.getElementById("eligibleTable");
const eligibleHint = document.getElementById("eligibleHint");

let viewingDriveId = null;
let companyCombo;

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function initCompanyCombo() {
    const root = document.getElementById("companyCombo");
    companyCombo = Combo.init(root, {
        getItems: () => PDMS.getCompanies(),
        getValue: (c) => c.id,
        getLabel: (c) => c.name,
        filter: (q, c) => {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            const n = c.name.toLowerCase();
            const ind = (c.industry || "").toLowerCase();
            return n.includes(qq) || ind.includes(qq);
        },
        maxSuggestions: 50,
    });
}

function criteriaText(d) {
    return `CGPA ≥ ${d.minCgpa} · ${d.branch}`;
}

function renderDrives() {
    driveTable.innerHTML = "";
    const drives = PDMS.getDrives();

    drives.forEach((d) => {
        const co = PDMS.companyById(d.companyId);
        const companyName = co ? co.name : "—";
        const row = document.createElement("tr");
        row.dataset.driveId = d.id;
        if (viewingDriveId === d.id) {
            row.classList.add("row-selected");
        }

        const statusClass = d.status === "Open" ? "status-open" : "status-closed";
        row.innerHTML = `
            <td>${escapeHtml(companyName)}</td>
            <td>${escapeHtml(d.role)}</td>
            <td>${escapeHtml(d.package)} LPA</td>
            <td>${escapeHtml(criteriaText(d))}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(d.status)}</span></td>
            <td><button type="button" class="view-btn view-inline" data-drive-id="${escapeHtml(d.id)}">View</button></td>
        `;
        driveTable.appendChild(row);
    });

    driveTable.querySelectorAll(".view-inline").forEach((btn) => {
        btn.addEventListener("click", () => {
            viewingDriveId = btn.getAttribute("data-drive-id");
            renderDrives();
            showEligibleForDrive(viewingDriveId);
            const panel = document.getElementById("eligiblePanel");
            if (panel) {
                panel.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function showEligibleForDrive(driveId) {
    eligibleTable.innerHTML = "";
    const d = PDMS.driveById(driveId);
    if (!d) {
        eligibleTable.innerHTML = `<tr><td colspan="4">Drive not found.</td></tr>`;
        eligibleHint.textContent = "";
        return;
    }

    const co = PDMS.companyById(d.companyId);
    eligibleHint.textContent = `Eligible students for ${co ? co.name : "—"} — ${d.role} (${criteriaText(d)}).`;

    const students = PDMS.getStudents().filter((s) => PDMS.isEligibleForDrive(s, d));

    if (students.length === 0) {
        eligibleTable.innerHTML = `<tr><td colspan="4">No eligible students (CGPA ≥ min CGPA and branch must match).</td></tr>`;
        return;
    }

    students.forEach((s) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(s.reg)}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.branch)}</td>
            <td>${Number(s.cgpa).toFixed(2)}</td>
        `;
        eligibleTable.appendChild(row);
    });
}

function addDrive() {
    const companyId = companyCombo ? companyCombo.getValue() : "";
    const role = document.getElementById("role").value.trim();
    const pkg = parseFloat(document.getElementById("package").value);
    const date = document.getElementById("date").value;
    const venue = document.getElementById("venue").value.trim();
    const minCgpa = parseFloat(document.getElementById("cgpa").value);
    const branch = document.getElementById("branch").value.trim();
    const statusEl = document.getElementById("driveStatus");
    const status = statusEl ? statusEl.value : "Open";

    if (!companyId || !role || !date || !venue || !branch) {
        alert("Fill all required fields (company, role, package, date, venue, min CGPA, branch).");
        return;
    }

    if (Number.isNaN(pkg) || pkg <= 0) {
        alert("Package must be greater than 0.");
        return;
    }

    if (Number.isNaN(minCgpa) || minCgpa < 0 || minCgpa > 10) {
        alert("Min CGPA must be between 0 and 10.");
        return;
    }

    if (status !== "Open" && status !== "Closed") {
        alert("Invalid drive status.");
        return;
    }

    const drives = PDMS.getDrives();
    drives.push({
        id: PDMS.uid("d"),
        companyId,
        role,
        package: pkg,
        date,
        venue,
        minCgpa,
        branch,
        status,
    });
    PDMS.saveDrives(drives);

    document.getElementById("role").value = "";
    document.getElementById("package").value = "";
    document.getElementById("date").value = "";
    document.getElementById("venue").value = "";
    document.getElementById("cgpa").value = "";
    document.getElementById("branch").value = "";
    const ds = document.getElementById("driveStatus");
    if (ds) ds.value = "Open";

    if (companyCombo) companyCombo.clear();

    renderDrives();
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

initCompanyCombo();
renderDrives();
