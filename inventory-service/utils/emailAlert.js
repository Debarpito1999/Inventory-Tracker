const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, message, html = null, returnDetails = false) => {
  console.log('📧 Attempting to send email...');
  console.log('   To:', to);
  console.log('   Subject:', subject);

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const errorMsg = 'Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in .env';
      console.error('❌', errorMsg);
      if (returnDetails) {
        return { success: false, error: { message: errorMsg, code: 'CONFIG_MISSING' } };
      }
      return false;
    }

    if (!to) {
      const errorMsg = 'Recipient email address is missing';
      console.error('❌', errorMsg);
      if (returnDetails) {
        return { success: false, error: { message: errorMsg, code: 'NO_RECIPIENT' } };
      }
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `Inventory System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html: html || message
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!', info.messageId);

    if (returnDetails) {
      return { success: true, messageId: info.messageId };
    }
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    if (returnDetails) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          responseCode: error.responseCode,
          response: error.response
        }
      };
    }
    return false;
  }
};

module.exports = sendEmail;

