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
        // 1️⃣ Email pour toi (admin)
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
        // 2️⃣ Réponse automatique via Gemini
        // -------------------------
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",  // ★★★ Nouveau modèle correct
        });

        const prompt = `
Tu es un conseiller expert pour les étudiants marocains voulant étudier en Chine.
Réponds DIRECTEMENT à la question du client :

"${message}"

Réponds dans la même langue que le message (FR ou AR).
Réponse claire, utile, professionnelle, adaptée à un étudiant.
        `;

        const aiResponse = await model.generateContent(prompt);
        const aiReply = aiResponse.response.text();

        // -------------------------
        // 3️⃣ Envoyer la réponse AI au client
        // -------------------------
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Réponse à votre demande ✔",
            text: aiReply,
        });

        // -------------------------
        // 4️⃣ Réponse API
        // -------------------------
        return res.status(200).json({
            success: true,
            ai_reply: aiReply,
            message: "Message et réponse automatique envoyés ✔",
        });

    } catch (error) {
        console.error("ERREUR API :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.toString(),
        });
    }
}
