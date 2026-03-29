/**
 * PDMS — API-backed data layer.
 * Replaces the localStorage version. All reads/writes go to Flask.
 */
(function () {

    const API = "";  // Flask runs on same origin — no prefix needed

    // ── tiny helpers ──────────────────────────────────────────────
    function uid(prefix) {
        return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function branchesMatch(a, b) {
        return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    }

    function isEligibleForDrive(student, drive) {
        if (!student || !drive) return false;
        return Number(student.cgpa) >= Number(drive.minCgpa) &&
               branchesMatch(student.branch, drive.branch);
    }

    // ── in-memory cache (filled on first load) ────────────────────
    let _students    = null;
    let _companies   = null;
    let _drives      = null;
    let _applications= null;
    let _results     = null;
    let _skills      = null;

    async function fetchJSON(url) {
        const r = await fetch(API + url);
        if (!r.ok) throw new Error("API error " + r.status + " " + url);
        return r.json();
    }

    async function postJSON(url, body) {
        const r = await fetch(API + url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return r.json();
    }

    async function patchJSON(url, body) {
        const r = await fetch(API + url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return r.json();
    }

    async function deleteJSON(url, body) {
        const r = await fetch(API + url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        return r.json();
    }

    // ── load everything at startup ────────────────────────────────
    async function loadAll() {
        try {
            [_students, _companies, _drives, _applications, _results, _skills] = await Promise.all([
                fetchJSON("/api/students"),
                fetchJSON("/api/companies"),
                fetchJSON("/api/drives"),
                fetchJSON("/api/applications"),
                fetchJSON("/api/results"),
                fetchJSON("/api/skills"),
            ]);
        } catch(e) {
            console.error("PDMS: failed to load data from server", e);
            alert("Cannot reach the Flask server.\nMake sure app.py is running on http://127.0.0.1:5000");
        }
    }

    // ── STUDENTS ──────────────────────────────────────────────────
    function getStudents()          { return _students || []; }
    function studentByReg(reg)      { return getStudents().find(s => s.reg === reg); }

    async function saveStudentAdd(student) {
        const res = await postJSON("/api/students", student);
        if (res.ok) {
            _students = await fetchJSON("/api/students");
        }
        return res;
    }

    async function saveStudentDelete(reg) {
        const res = await deleteJSON("/api/students/" + encodeURIComponent(reg));
        if (res.ok) {
            _students     = await fetchJSON("/api/students");
            _skills       = await fetchJSON("/api/skills");
            _applications = await fetchJSON("/api/applications");
            _results      = await fetchJSON("/api/results");
        }
        return res;
    }

    // Keep old-style sync save for pages that use saveStudents(list) directly
    // (they won't be called anymore — kept so nothing crashes)
    function saveStudents(list) { _students = list; }

    // ── SKILLS ────────────────────────────────────────────────────
    function getSkills()            { return _skills || []; }

    async function saveSkillAdd(reg, skill) {
        const res = await postJSON("/api/skills", { reg, skill });
        if (res.ok) _skills = await fetchJSON("/api/skills");
        return res;
    }

    async function saveSkillDelete(reg, skill) {
        const res = await deleteJSON("/api/skills", { reg, skill });
        if (res.ok) _skills = await fetchJSON("/api/skills");
        return res;
    }

    function saveSkills(list) { _skills = list; }

    // ── COMPANIES ─────────────────────────────────────────────────
    function getCompanies()         { return _companies || []; }
    function companyById(id)        { return getCompanies().find(c => c.id === id); }

    async function saveCompanyAdd(company) {
        const res = await postJSON("/api/companies", company);
        if (res.ok) _companies = await fetchJSON("/api/companies");
        return res;
    }

    function saveCompanies(list)    { _companies = list; }

    // ── DRIVES ────────────────────────────────────────────────────
    function getDrives()            { return _drives || []; }
    function driveById(id)          { return getDrives().find(d => d.id === id); }

    async function saveDriveAdd(drive) {
        const res = await postJSON("/api/drives", drive);
        if (res.ok) _drives = await fetchJSON("/api/drives");
        return res;
    }

    function saveDrives(list)       { _drives = list; }

    // ── APPLICATIONS ──────────────────────────────────────────────
    function getApplications()      { return _applications || []; }

    async function saveApplicationAdd(app) {
        const res = await postJSON("/api/applications", app);
        if (res.ok) _applications = await fetchJSON("/api/applications");
        return res;
    }

    async function saveApplicationStatus(id, status) {
        const res = await patchJSON("/api/applications/" + encodeURIComponent(id), { status });
        if (res.ok) _applications = await fetchJSON("/api/applications");
        return res;
    }

    function saveApplications(list) { _applications = list; }

    // ── RESULTS ───────────────────────────────────────────────────
    function getResults()           { return _results || []; }

    async function saveResultAdd(result) {
        const res = await postJSON("/api/results", result);
        if (res.ok) _results = await fetchJSON("/api/results");
        return res;
    }

    function saveResults(list)      { _results = list; }

    // ── EXPOSE ────────────────────────────────────────────────────
    window.PDMS = {
        uid,
        branchesMatch,
        isEligibleForDrive,
        loadAll,

        // students
        getStudents, studentByReg, saveStudents,
        saveStudentAdd, saveStudentDelete,

        // skills
        getSkills, saveSkills,
        saveSkillAdd, saveSkillDelete,

        // companies
        getCompanies, companyById, saveCompanies,
        saveCompanyAdd,

        // drives
        getDrives, driveById, saveDrives,
        saveDriveAdd,

        // applications
        getApplications, saveApplications,
        saveApplicationAdd, saveApplicationStatus,

        // results
        getResults, saveResults,
        saveResultAdd,
    };

    // Auto-load when the script is parsed
    loadAll();

})();
