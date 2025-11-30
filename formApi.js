const form = document.getElementById("contactForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

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
            alert(result.message);
        } catch (error) {
            alert("Erreur : impossible de contacter le serveur.");
        }
    });
}
