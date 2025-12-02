const form = document.getElementById("contactForm");

// Vérifier le format d'un email
function isValidEmailFormat(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.email.value;

        // 1) Vérifier le format email
        if (!isValidEmailFormat(email)) {
            alert("❌ L'adresse email est invalide. Merci d'en entrer une correcte.");
            return;
        }

        const data = {
            nom: form.nom.value,
            prenom: form.prenom.value,
            email: form.email.value,
            subject: form.subject.value,
            message: form.message.value
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            // 2) Si le backend dit erreur → afficher alert
            if (!res.ok) {
                alert("❌ " + result.message);
                return;
            }

            // 3) Succès
            alert("✔ " + result.message);

            // Reset form
            form.reset();

        } catch (error) {
            alert("❌ Erreur : impossible de contacter le serveur.");
        }
    });
}
