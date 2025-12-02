import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    try {
        const { nom, prenom, email, subject, message } = req.body;

        if (!nom || !prenom || !email || !subject || !message) {
            return res.status(400).json({ message: "Champs manquants" });
        }

        // -------------------------
        // 1️⃣ EMAIL POUR TOI (ADMIN)
        // -------------------------
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Message du client :
${message}
            `,
        });

        // -------------------------
        // 2️⃣ APPEL À GEMINI (nouvelle version)
        // -------------------------
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // 🔥 modèle CORRECT
        });

        const prompt = `
Tu es un expert qui aide les étudiants marocains à étudier en Chine.

Réponds DIRECTEMENT à la question suivante :
"${message}"

Donne une réponse claire, utile, professionnelle.
Réponds dans la même langue que la question (FR ou AR).
        `;

        const aiResult = await model.generateContent(prompt);
        const aiReply = aiResult.response.text();

        // -------------------------
        // 3️⃣ ENVOYER LA RÉPONSE AU CLIENT
        // -------------------------
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Réponse à votre demande ✔",
            text: aiReply,
        });

        // -------------------------
        // 4️⃣ RÉPONSE SERVEUR
        // -------------------------
        return res.status(200).json({
            success: true,
            message: "Message envoyé + réponse automatique envoyée ✔",
            aiReply: aiReply,
        });

    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.toString(),
        });
    }
}
