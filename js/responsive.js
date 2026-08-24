document.addEventListener("DOMContentLoaded", () => {
    // Ic sayfalar: .navbar + #mobile-toggle
    const toggleBtn = document.getElementById("mobile-toggle");
    const navbar = document.querySelector(".navbar");

    if (toggleBtn && navbar) {
        navbar.classList.remove("active");
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.textContent = "▼";

        toggleBtn.addEventListener("click", () => {
            const isOpen = navbar.classList.toggle("active");
            toggleBtn.textContent = isOpen ? "▲" : "▼";
            toggleBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // Anasayfa: .home-menu + .home-auth-nav
    const homeMenuBtn = document.querySelector(".home-menu");
    const homeAuthNav = document.querySelector(".home-auth-nav");

    if (homeMenuBtn && homeAuthNav) {
        homeMenuBtn.setAttribute("aria-expanded", "false");

        homeMenuBtn.addEventListener("click", () => {
            const isOpen = homeAuthNav.classList.toggle("is-open");
            homeMenuBtn.setAttribute("aria-expanded", String(isOpen));
            homeMenuBtn.textContent = isOpen ? "✕" : "☰";
        });
    }
});
