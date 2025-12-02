import nodemailer from "nodemailer";

// --- Fonction qui demande une réponse précise à Gemini ---
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
                                    "Réponds DIRECTEMENT au message de l'utilisateur. " +
                                    "Donne une réponse claire, détaillée et utile. " +
                                    "Tu es un expert en études en Chine. Voici son message : " + message
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();

    // → SI Gemini répond correctement :
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    // → SI Gemini n’a pas pu répondre (rare), une phrase propre :
    return "Merci pour votre message. Nous allons revenir vers vous avec plus de détails.";
}

// --- API principale ---
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { nom, prenom, email, subject, message } = req.body;

    try {
        // 1. Demander la réponse intelligente à Gemini
        const autoReply = await generateAiReply(message);

        // 2. Configurer Gmail via Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // 3. Envoyer la réponse automatique AU CLIENT
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Réponse à votre demande ✔",
            text: autoReply
        });

        // 4. T'envoyer le message + la réponse générée
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: `Nouveau message : ${subject}`,
            text: `
Message reçu de ${nom} ${prenom} (${email}) :

${message}

-------------------------------

Réponse générée par l'IA (Gemini) :

${autoReply}
`
        });

        return res.status(200).json({
            message: "Message envoyé + réponse automatique générée !"
        });

    } catch (error) {
        console.error("Erreur API :", error);
        return res.status(500).json({ message: "Erreur serveur." });
    }
}
