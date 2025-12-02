import nodemailer from "nodemailer";

// -----------------------------
// 1) Vérifier si un email existe vraiment
// -----------------------------
async function emailExists(email) {
    try {
        const apiKey = process.env.EMAIL_CHECK_KEY;

        const res = await fetch(
            `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`
        );

        const data = await res.json();

        // deliverable → email réel
        return data.deliverability === "DELIVERABLE";
    } catch (error) {
        console.error("Erreur verification email :", error);

        // Si problème de réseau → on considère valide
        return true;
    }
}

// -----------------------------
// 2) Générer une réponse automatique via Gemini AI
// -----------------------------
async function generateAiReply(message) {
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    "Tu es un expert en études en Chine. Réponds clairement et poliment. Message : " + message
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();

    return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Merci pour votre message ! Nous vous répondrons bientôt."
    );
}

// -----------------------------
// 3) API principale
// -----------------------------
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    // Vérification champs vide
    if (!nom || !prenom || !email || !subject || !message) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    // Vérification email réel
    const isRealEmail = await emailExists(email);

    if (!isRealEmail) {
        return res.status(400).json({
            success: false,
            message: "L'adresse email n'existe pas réellement. Merci d'utiliser un email valide."
        });
    }

    try {
        // 1) Réponse automatique AI
        const autoReply = await generateAiReply(message);

        // 2) Config nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            }
        });

        // 3) Envoyer la réponse automatique au client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: autoReply
        });

        // 4) Envoyer le message complet à toi (admin)
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message reçu : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Message :
${message}

-----------------------------

Réponse envoyée automatiquement :
${autoReply}
`
        });

        return res.status(200).json({
            success: true,
            message: "Message envoyé et réponse automatique envoyée."
        });

    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ message: "Erreur serveur." });
    }
}
