export const config = {
    runtime: "edge"
};

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
                                    "Tu es un expert professionnel qui répond aux questions des étudiants sur les études en Chine. Réponds clairement et utilement. Message de l'utilisateur : " +
                                    message
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text
        || "Merci pour votre message ! Nous reviendrons vers vous rapidement.";
}

// --- API principale ---
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    try {
        // Réponse automatique Gemini
        const autoReply = await generateAiReply(message);

        // Transport Gmail
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // Email vers le client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: autoReply
        });

        // Email vers toi
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}
---------------------
Message :
${message}
---------------------
Réponse automatique :
${autoReply}
`
        });

        return res.status(200).json({ message: "OK — message + réponse envoyés" });

    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
}
