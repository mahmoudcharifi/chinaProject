export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { message } = req.body;

    // Fonction pour tester Gemini
    async function testGemini(userMessage) {
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
                                { text: userMessage }
                            ]
                        }
                    ]
                })
            }
        );

        return await response.json();
    }

    try {
        const result = await testGemini(message);

        return res.status(200).json({
            success: true,
            gemini_raw: result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
