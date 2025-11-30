import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    if (!nom || !prenom || !email || !subject || !message) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            replyTo: email,
            to: process.env.GMAIL_USER,
            subject: `Nouvelle demande : ${subject}`,
            text: `
Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Sujet : ${subject}

Message :
${message}
            `
        });

        return res.status(200).json({ message: "Message envoyé avec succès !" });

    } catch (error) {
        console.error("Erreur Nodemailer :", error);
        return res.status(500).json({ message: "Erreur lors de l'envoi du mail." });
    }
}
