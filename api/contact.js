import nodemailer from 'nodemailer';

export default async function handler(req, res) {
if (req.method === 'POST') {
const { nom, email, subject, message } = req.body;

```
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // ton Gmail
    pass: process.env.GMAIL_PASSWORD    // mot de passe application
  }
});

const mailOptions = {
  from: email,
  to: process.env.GMAIL_USER,
  subject: `Nouvelle demande: ${subject}`,
  text: `Nom: ${nom}\nEmail: ${email}\nSujet: ${subject}\nMessage: ${message}`
};

try {
  await transporter.sendMail(mailOptions);
  res.status(200).json({ message: 'Message envoyé avec succès !' });
} catch (error) {
  res.status(500).json({ message: 'Erreur lors de l\'envoi.', error });
}
```

} else {
res.status(405).json({ message: 'Méthode non autorisée' });
}
}
