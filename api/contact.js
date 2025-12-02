import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Vérifier si l'email existe réellement
async function emailExists(email) {
    const key = process.env.MAILBOX_KEY;

    const response = await fetch(
        `https://apilayer.net/api/check?access_key=${key}&email=${email}&smtp=1&format=1`
    );

    const data = await response.json();

    return data.smtp_check === true; // true = email existe
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    try {
        const { nom, prenom, email, subject, message } = req.body;

        if (!nom || !prenom || !email || !subject || !message) {
            return res.status(400).json({ message: "Champs manquants" });
        }

        // Vérification email réel
        const isReal = await emailExists(email);

        if (!isReal) {
            return res.status(400).json({
                success: false,
                message: "Cet email n'existe pas réellement. Merci d'en entrer un valide."
            });
        }

        // 1) Config Gmail
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });

        // 2) Envoi du message à l’admin
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
            `,
        });

        // 3) Réponse automatique AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const prompt = `
Réponds comme un conseiller expert en études en Chine.

Message du client :
"${message}"

Réponds dans sa langue.
        `;

        const aiResult = await model.generateContent(prompt);
        const aiReply = aiResult.response.text();

        // 4) Envoi de la réponse automatique au client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✔",
            text: aiReply,
        });

        return res.status(200).json({
            success: true,
            message: "Message envoyé + réponse automatique envoyée ✔",
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
