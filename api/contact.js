import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { nom, prenom, email, subject, message } = req.body;

  if (!nom || !prenom || !email || !subject || !message) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  // Créer le transporter Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: email,
    to: process.env.GMAIL_USER,
    subject: `Nouvelle demande: ${subject}`,
    text: `Nom: ${nom}\nPrénom: ${prenom}\nEmail: ${email}\nSujet: ${subject}\nMessage: ${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Message envoyé avec succès !' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du mail.', error });
  }
}
