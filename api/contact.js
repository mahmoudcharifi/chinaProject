export const config = {
    runtime: "nodejs" // <-- IMPORTANT : PAS EDGE POUR L’INSTANT
};

import nodemailer from "nodemailer";

async function generateAiReply(message) {
    console.log("🔍 [DEBUG] Appel Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔍 [DEBUG] GEMINI_API_KEY =", apiKey ? "OK" : "MANQUANT ❌");

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
                                text: "Réponds comme un expert. Question de l'utilisateur : " + message
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();
    console.log("🔍 [DEBUG] Réponse Gemini =", data);

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Merci pour votre message !";
}

export default async function handler(req, res) {
    console.log("🚀 [DEBUG] API contact démarrée");

    if (req.method !== "POST") {
        console.log("❌ [DEBUG] Méthode non autorisée :", req.method);
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    console.log("📩 [DEBUG] Body reçu :", req.body);

    const { nom, prenom, email, subject, message } = req.body;

    try {
        console.log("✉️ [DEBUG] Configuration Nodemailer...");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        console.log("🔍 [DEBUG] GMAIL_USER =", process.env.GMAIL_USER ? "OK" : "MANQUANT ❌");
        console.log("🔍 [DEBUG] GMAIL_PASSWORD =", process.env.GMAIL_PASSWORD ? "OK" : "MANQUANT ❌");

        // TEST Gmail credentials
        await transporter.verify();
        console.log("✅ [DEBUG] SMTP Gmail prêt");

        // Réponse AI
        const autoReply = await generateAiReply(message);

        console.log("🤖 [DEBUG] Réponse AI :", autoReply);

        // Email vers client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: autoReply
        });

        console.log("📤 [DEBUG] Email envoyé au client");

        // Email admin
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}
Message :
${message}

Réponse automatique :
${autoReply}
`
        });

        console.log("📥 [DEBUG] Email envoyé à l’admin");

        return res.status(200).json({ message: "Message envoyé" });

    } catch (err) {
        console.error("🔥 [ERREUR] Crash API :", err);
        return res.status(500).json({ message: "Erreur serveur", error: err.toString() });
    }
}
