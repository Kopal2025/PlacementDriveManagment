function navigate(page) {
    window.location.href = "pages/" + page + ".html";
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    sidebar.classList.toggle("active");
    main.classList.toggle("shift");
}