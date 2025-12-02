import nodemailer from "nodemailer";
import GoogleGenerativeAI from "@google/generative-ai";

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
    // 1️⃣ CONFIG GMAIL (pour t’envoyer le message)
    // -------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    // Email que TU vas recevoir (info client)
    const adminMailOptions = {
      from: email,
      to: process.env.GMAIL_USER,
      subject: `Nouveau message : ${subject}`,
      text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Sujet : ${subject}

Message :
${message}
      `,
    };

    await transporter.sendMail(adminMailOptions);

    // -------------------------
    // 2️⃣ APPEL API GEMINI (réponse intelligente)
    // -------------------------

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash-latest",
    });

    const prompt = `
Tu es un conseiller expert pour étudiants marocains qui veulent étudier en Chine.

Voici la question du client :
"${message}"

Réponds en arabe ou en français selon la langue utilisée dans la question.
Réponse simple, claire, professionnelle, et utile.
    `;

    const aiResult = await model.generateContent(prompt);
    const aiReply = aiResult.response.text();

    // -------------------------
    // 3️⃣ ENVOYER LA RÉPONSE AU CLIENT
    // -------------------------

    const clientMailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Réponse à votre demande ✔",
      text: aiReply,
    };

    await transporter.sendMail(clientMailOptions);

    // -------------------------
    // 4️⃣ REPONSE API
    // -------------------------

    return res.status(200).json({
      success: true,
      message: "Message envoyé avec succès et réponse automatique envoyée.",
      ai_reply: aiReply,
    });

  } catch (error) {
    console.error("Erreur API :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
}
