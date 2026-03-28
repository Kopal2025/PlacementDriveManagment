const STATUS_OPTIONS = [
    { value: "Applied", label: "Applied" },
    { value: "Shortlisted", label: "Shortlisted" },
    { value: "Selected", label: "Selected" },
    { value: "Rejected", label: "Rejected" },
];

let driveCombo;
let studentCombo;

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str != null ? String(str) : "";
    return d.innerHTML;
}

function driveLabel(d) {
    const co = PDMS.companyById(d.companyId);
    const companyName = co ? co.name : "—";
    return `${companyName} — ${d.role}`;
}

function getEligibleStudentsForDrive(driveId) {
    const drive = PDMS.driveById(driveId);
    if (!drive) return [];
    return PDMS.getStudents().filter((s) => PDMS.isEligibleForDrive(s, drive));
}

function onDriveChange() {
    const driveId = driveCombo ? driveCombo.getValue() : "";
    const studentRow = document.getElementById("studentRow");
    const eligibleInfo = document.getElementById("eligibleInfo");
    const msg = document.getElementById("message");

    msg.textContent = "";
    msg.className = "msg-line";

    if (!driveId) {
        studentRow.classList.add("hidden");
        if (studentCombo) studentCombo.clear();
        eligibleInfo.textContent = "";
        return;
    }

    const drive = PDMS.driveById(driveId);
    const eligible = getEligibleStudentsForDrive(driveId);

    eligibleInfo.textContent = `Eligible students for this drive: ${eligible.length}`;

    if (drive && drive.status === "Closed") {
        eligibleInfo.textContent += " (drive is closed — new applications blocked).";
    }

    if (studentCombo) {
        studentCombo.clear();
        studentCombo.refresh();
    }
    studentRow.classList.remove("hidden");
}

function initCombos() {
    driveCombo = Combo.init(document.getElementById("driveCombo"), {
        getItems: () => PDMS.getDrives(),
        getValue: (d) => d.id,
        getLabel: (d) => driveLabel(d),
        filter: (q, d) => {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            return driveLabel(d).toLowerCase().includes(qq);
        },
        maxSuggestions: 50,
        onChange: onDriveChange,
    });

    studentCombo = Combo.init(document.getElementById("studentCombo"), {
        getItems: () => {
            const driveId = driveCombo.getValue();
            if (!driveId) return [];
            return getEligibleStudentsForDrive(driveId);
        },
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

function applyToDrive() {
    const studentReg = studentCombo ? studentCombo.getValue() : "";
    const driveId = driveCombo ? driveCombo.getValue() : "";
    const msg = document.getElementById("message");

    msg.textContent = "";
    msg.className = "msg-line";

    if (!driveId) {
        msg.textContent = "Please select a drive first.";
        msg.classList.add("msg-error");
        return;
    }

    if (!studentReg) {
        msg.textContent = "Please select an eligible student.";
        msg.classList.add("msg-error");
        return;
    }

    const student = PDMS.studentByReg(studentReg);
    const drive = PDMS.driveById(driveId);

    if (!student || !drive) {
        msg.textContent = "Invalid selection.";
        msg.classList.add("msg-error");
        return;
    }

    if (drive.status === "Closed") {
        msg.textContent = "This placement drive is no longer accepting applications.";
        msg.classList.add("msg-error");
        return;
    }

    if (!PDMS.isEligibleForDrive(student, drive)) {
        msg.textContent = "Student not eligible";
        msg.classList.add("msg-error");
        return;
    }

    const applications = PDMS.getApplications();
    const dup = applications.some((a) => a.studentReg === studentReg && a.driveId === driveId);
    if (dup) {
        msg.textContent = "This student already has an application for this drive.";
        msg.classList.add("msg-error");
        return;
    }

    applications.push({
        id: PDMS.uid("a"),
        studentReg,
        driveId,
        status: "Applied",
    });
    PDMS.saveApplications(applications);

    msg.textContent = "Application added successfully.";
    msg.classList.add("msg-success");
    renderTable();
}

function renderTable() {
    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    const applications = PDMS.getApplications();

    applications.forEach((a, index) => {
        const student = PDMS.studentByReg(a.studentReg);
        const drive = PDMS.driveById(a.driveId);
        const studentName = student ? `${student.name} (${student.reg})` : a.studentReg;
        const driveStr = drive ? driveLabel(drive) : a.driveId;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(studentName)}</td>
            <td>${escapeHtml(driveStr)}</td>
            <td class="status-cell"></td>
        `;

        const td = row.querySelector(".status-cell");
        const sel = document.createElement("select");
        sel.className = "status-dropdown";
        sel.setAttribute("aria-label", "Application status");
        STATUS_OPTIONS.forEach((opt) => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.label;
            if (a.status === opt.value) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener("change", () => {
            updateStatus(index, sel.value);
        });
        td.appendChild(sel);

        table.appendChild(row);
    });
}

function updateStatus(i, val) {
    const applications = PDMS.getApplications();
    if (!applications[i]) return;
    applications[i].status = val;
    PDMS.saveApplications(applications);
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("main").classList.toggle("shift");
}

initCombos();
renderTable();
