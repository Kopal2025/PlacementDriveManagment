const STATUS_OPTIONS = [
    { value:"Applied",     label:"Applied" },
    { value:"Shortlisted", label:"Shortlisted" },
    { value:"Selected",    label:"Selected" },
    { value:"Rejected",    label:"Rejected" },
];

let driveCombo, studentCombo;

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function driveLabel(d) {
    const co = PDMS.companyById(d.companyId);
    return `${co ? co.name : "—"} — ${d.role}`;
}

function getEligibleStudentsForDrive(driveId) {
    const drive = PDMS.driveById(driveId);
    if (!drive) return [];
    return PDMS.getStudents().filter(s => PDMS.isEligibleForDrive(s, drive));
}

function onDriveChange() {
    const driveId = driveCombo ? driveCombo.getValue() : "";
    const studentRow  = document.getElementById("studentRow");
    const eligibleInfo= document.getElementById("eligibleInfo");
    const msg = document.getElementById("message");
    msg.textContent = ""; msg.className = "msg-line";

    if (!driveId) {
        studentRow.classList.add("hidden");
        if (studentCombo) studentCombo.clear();
        eligibleInfo.textContent = "";
        return;
    }

    const drive   = PDMS.driveById(driveId);
    const eligible= getEligibleStudentsForDrive(driveId);
    eligibleInfo.textContent = `Eligible students: ${eligible.length}` +
        (drive && drive.status === "Closed" ? " (drive is closed — new applications blocked)." : "");
    if (studentCombo) { studentCombo.clear(); studentCombo.refresh(); }
    studentRow.classList.remove("hidden");
}

function initCombos() {
    driveCombo = Combo.init(document.getElementById("driveCombo"), {
        getItems:  () => PDMS.getDrives(),
        getValue:  d  => d.id,
        getLabel:  d  => driveLabel(d),
        filter:    (q,d) => { const qq=q.trim().toLowerCase(); return !qq||driveLabel(d).toLowerCase().includes(qq); },
        maxSuggestions: 50,
        onChange: onDriveChange,
    });

    studentCombo = Combo.init(document.getElementById("studentCombo"), {
        getItems:  () => { const id=driveCombo.getValue(); return id ? getEligibleStudentsForDrive(id) : []; },
        getValue:  s  => s.reg,
        getLabel:  s  => `${s.name} (${s.reg})`,
        filter:    (q,s) => { const qq=q.trim().toLowerCase(); return !qq||s.name.toLowerCase().includes(qq)||String(s.reg).toLowerCase().includes(qq); },
        maxSuggestions: 50,
    });
}

async function applyToDrive() {
    const studentReg = studentCombo ? studentCombo.getValue() : "";
    const driveId    = driveCombo   ? driveCombo.getValue()   : "";
    const msg = document.getElementById("message");
    msg.textContent = ""; msg.className = "msg-line";

    if (!driveId)    { msg.textContent="Select a drive first."; msg.classList.add("msg-error"); return; }
    if (!studentReg) { msg.textContent="Select an eligible student."; msg.classList.add("msg-error"); return; }

    const res = await PDMS.saveApplicationAdd({ studentReg, driveId });
    if (!res.ok) {
        msg.textContent = res.error || "Failed to apply.";
        msg.classList.add("msg-error");
        return;
    }
    msg.textContent = "Application added successfully.";
    msg.classList.add("msg-success");
    renderTable();
}

function renderTable() {
    const table = document.getElementById("tableBody");
    table.innerHTML = "";
    PDMS.getApplications().forEach(a => {
        const student = PDMS.studentByReg(a.studentReg);
        const drive   = PDMS.driveById(a.driveId);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(student ? `${student.name} (${student.reg})` : a.studentReg)}</td>
            <td>${escapeHtml(drive   ? driveLabel(drive) : a.driveId)}</td>
            <td class="status-cell"></td>
        `;
        const td  = row.querySelector(".status-cell");
        const sel = document.createElement("select");
        sel.className = "status-dropdown";
        STATUS_OPTIONS.forEach(opt => {
            const o = document.createElement("option");
            o.value = opt.value; o.textContent = opt.label;
            if (a.status === opt.value) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener("change", async () => {
            await PDMS.saveApplicationStatus(a.id, sel.value);
        });
        td.appendChild(sel);
        table.appendChild(row);
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

(async () => {
    await PDMS.loadAll();
    initCombos();
    renderTable();
})();
