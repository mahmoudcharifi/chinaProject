 const villeDiv = document.querySelector(".villeDiv");
        const villes = document.querySelectorAll(".villes");

        let index = 0;
        let visibleCount = getVisibleCount(); 
        const total = villes.length;

        function getVisibleCount() {
            if (window.innerWidth > 1251) return 3;
            if (window.innerWidth > 757) return 2;
            return 1;
        }

        function updateVisibility() {
            villes.forEach((v, i) => {
                if (i >= index && i < index + visibleCount) {
                    v.style.display = "block";
                } else {
                    v.style.display = "none";
                }
            });
        }

        document.querySelector("#prevBtn").addEventListener("click", () => {
    index += 1; 
    if (index > total - visibleCount) {
        index = 0; 
    }
    updateVisibility();
});

document.querySelector("#nextBtn").addEventListener("click", () => {
    index -= 1; 
    if (index < 0) {
        index = total - visibleCount;
    }
    updateVisibility();
});

        window.addEventListener("resize", () => {
            visibleCount = getVisibleCount();
            updateVisibility();
        });

        updateVisibility();






const playBtns = document.querySelectorAll(".PlayVd");
const modal = document.getElementById("videoModal");
const iframe = document.getElementById("youtubeFrame");
const closeBtn = document.getElementById("closeVideo");

playBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const link = btn.dataset.video;

        if (!link) return;

        const embed = link.replace("watch?v=", "embed/") + "?autoplay=1";

        iframe.src = embed;

        modal.style.display = "flex";
    });
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    iframe.src = "";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        iframe.src = "";
    }
});






const form = document.getElementById('contactForm');

form.addEventListener('submit', async (e) => {
e.preventDefault();

const data = {
nom: form.nom.value,
email: form.email.value,
subject: form.subject.value,
message: form.message.value
};

const res = await fetch('/api/contact', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data)
});

const result = await res.json();
alert(result.message);
form.reset();
});

