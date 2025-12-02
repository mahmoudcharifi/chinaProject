import nodemailer from "nodemailer";

// --- Demander une réponse à Gemini ---
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
                                    "Réponds au message de l'utilisateur de manière professionnelle, claire et utile. " +
                                    "Tu es un expert en conseils sur l'étude en Chine. Message de l'utilisateur : " + message
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
        "Merci pour votre message ! Nous reviendrons vers vous rapidement."
    );
}

// --- API principale ---
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    try {
        // 1. Générer la réponse de Gemini
        const autoReply = await generateAiReply(message);

        // 2. Configurer Gmail via Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // 3. Envoyer la réponse automatique au client
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Merci pour votre message ✨",
            text: autoReply
        });

        // 4. T’envoyer le message + la réponse
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message : ${subject}`,
            text: `
Nouveau message reçu :

Nom : ${nom}
Prénom : ${prenom}
Email : ${email}

Message du client :
${message}

---------------------------

Réponse générée par Gemini :
${autoReply}
`
        });

        return res.status(200).json({
            message: "Message et réponse automatique envoyés avec succès !"
        });

    } catch (error) {
        console.error("Erreur API :", error);
        return res.status(500).json({ message: "Erreur serveur." });
    }
}
