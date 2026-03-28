// =======================
// 🚀 NAVIGATION
// =======================
function navigate(page) {
    window.location.href = page + ".html";
}


// =======================
// 📂 SIDEBAR TOGGLE
// =======================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    if (sidebar && main) {
        sidebar.classList.toggle("active");
        main.classList.toggle("shift");
    }
}


// =======================
// ❌ CLOSE SIDEBAR ON OUTSIDE CLICK
// =======================
document.addEventListener("click", function (e) {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.querySelector(".menu-btn");

    if (
        sidebar &&
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        menuBtn &&
        !menuBtn.contains(e.target)
    ) {
        sidebar.classList.remove("active");
        document.getElementById("main").classList.remove("shift");
    }
});