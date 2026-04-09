const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Gymora" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Gymora!",
      html: `
        <h2>Thank you for subscribing to Gymora 💪</h2>
        <p>You will now receive fitness tips, offers and updates!</p>
        <br/>
        <p>Stay Strong 🔥</p>
      `,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Email failed to send" });
  }
});

module.exports = router;
