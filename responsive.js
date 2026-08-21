document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("mobile-toggle");
    const navbar = document.querySelector(".navbar"); // artık id gerek yok

    if (!toggleBtn || !navbar) return;

    // Başlangıçta navbar kapalı
    navbar.classList.remove("active");
    toggleBtn.textContent = "▼";

    toggleBtn.addEventListener("click", () => {
        navbar.classList.toggle("active");

        // Ok yönünü değiştir
        toggleBtn.textContent = navbar.classList.contains("active") ? "▲" : "▼";
    });
});