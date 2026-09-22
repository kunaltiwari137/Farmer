const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"AgriConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your AgriConnect Login OTP",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Your Login OTP</h2>
        <p>Use this code to complete your login:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };