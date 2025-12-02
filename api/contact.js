import nodemailer from "nodemailer";

// --- Fonction pour appeler Gemini AI ---
async function generateAiReply(message) {
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    "Tu es un expert professionnel qui répond aux questions des étudiants sur " +
                                    "les études en Chine. Réponds de manière polie, claire et utile. Message de l'utilisateur : " +
                                    message
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Merci pour votre message ! Nous vous répondrons bientôt.";
}

// --- API principale ---
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    try {
        // 1) Générer réponse automatique via Gemini
        const autoReply = await generateAiReply(message);

        // 2) Configurer Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // 3) Envoyer réponse automatique au client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: autoReply
        });

        // 4) Envoyer un email pour toi (admin)
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message reçu : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Message du client :
${message}

-----------------------------

Réponse automatique envoyée :
${autoReply}
`
        });

        return res.status(200).json({ message: "Message envoyé + réponse automatique envoyée !" });

    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ message: "Erreur serveur." });
    }
}
