
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");
const overlayMenu = document.getElementById("overlayMenu");

if (menuBtn && mobileMenu && closeMenu && overlayMenu) {

    menuBtn.addEventListener("click", () => {
        mobileMenu.classList.add("active");
        overlayMenu.style.display = "block";
        document.body.style.overflow = "hidden";
    });

    closeMenu.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        overlayMenu.style.display = "none";
        document.body.style.overflow = "auto";
    });

    overlayMenu.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        overlayMenu.style.display = "none";
        document.body.style.overflow = "auto";
    });
}