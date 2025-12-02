import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1) Fonction pour générer une réponse automatique via Gemini ---
async function generateAiReply(userMessage) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt =
            "Tu es un expert professionnel des études en Chine. " +
            "Réponds de manière claire, utile et polie à la question suivante : " +
            userMessage;

        const result = await model.generateContent(prompt);

        const reply = result?.response?.text();

        return reply || "Merci pour votre message ! Nous reviendrons vers vous sous 24h.";
    } catch (err) {
        console.error("Erreur Gemini :", err);
        return "Merci pour votre message ! Nous reviendrons vers vous sous 24h.";
    }
}

// --- 2) API Route principale ---
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    // Sécurités basiques
    if (!nom || !prenom || !email || !subject || !message) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    try {
        // A) Générer la réponse automatique avec Gemini
        const aiReply = await generateAiReply(message);

        // B) Configurer Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });

        // C) Envoyer l’email AUTOMATIQUE au client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: aiReply,
        });

        // D) T’envoyer à toi les infos du client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: `📨 Nouveau message : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Message du client :
${message}

-----------------------------

Réponse automatique envoyée au client :
${aiReply}
            `,
        });

        return res.status(200).json({
            success: true,
            message: "Message envoyé + réponse automatique envoyée ✔",
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur : impossible de contacter le serveur.",
        });
    }
}
