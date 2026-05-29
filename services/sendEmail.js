const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {

    console.log("📧 Sending email to:", to);

    // ✅ Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
      connectionTimeout: 10000,
    });

    // ✅ Verify SMTP connection
    await transporter.verify();

    console.log("✅ SMTP Connected");

    // ✅ Send email
    const info = await transporter.sendMail({
      from: `"GymOra" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email Sent:", info.response);

    return info;

  } catch (error) {

    console.error("❌ EMAIL ERROR:");
    console.error(error);

    throw error;
  }
};

module.exports = sendEmail;