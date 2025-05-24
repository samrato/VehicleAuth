const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateResetToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const sendResetEmail = async (email, token) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link will expire in 15 minutes.</p>
    `,
  });
};

module.exports = {
  generateResetToken,
  sendResetEmail,
};
