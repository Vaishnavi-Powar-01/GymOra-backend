const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  console.log("📧 Sending GymOra email to:", to);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"GymOra" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ GymOra Email Sent:", info.response);
};

module.exports = sendEmail;
