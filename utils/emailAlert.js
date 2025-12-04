const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message, html = null, returnDetails = false) => {
  console.log("📧 Attempting to send email...");
  console.log("   To:", to);
  console.log("   Subject:", subject);
  
  try {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const errorMsg = "Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in .env";
      console.error("❌", errorMsg);
      console.error("   EMAIL_USER:", process.env.EMAIL_USER ? "✓ Set" : "✗ Missing");
      console.error("   EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ Set" : "✗ Missing");
      
      if (returnDetails) {
        return { success: false, error: { message: errorMsg, code: "CONFIG_MISSING" } };
      }
      return false;
    }

    if (!to) {
      const errorMsg = "Recipient email address is missing";
      console.error("❌", errorMsg);
      if (returnDetails) {
        return { success: false, error: { message: errorMsg, code: "NO_RECIPIENT" } };
      }
      return false;
    }

    console.log("   Using SMTP:", process.env.EMAIL_HOST || "smtp.gmail.com");
    console.log("   Port:", parseInt(process.env.EMAIL_PORT) || 587);
    console.log("   From:", process.env.EMAIL_USER);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for others
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection first
    console.log("   Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("   ✓ SMTP connection verified");
    } catch (verifyError) {
      console.error("   ❌ SMTP verification failed:", verifyError.message);
      if (returnDetails) {
        return { 
          success: false, 
          error: { 
            message: verifyError.message, 
            code: verifyError.code || "VERIFY_FAILED",
            details: "SMTP connection verification failed"
          } 
        };
      }
      return false;
    }

    // Email options
    const mailOptions = {
      from: `Inventory System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html: html || message,
    };

    // Send email
    console.log("   Sending email...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("   To:", to);
    console.log("   Message ID:", info.messageId);
    
    if (returnDetails) {
      return { success: true, messageId: info.messageId };
    }
    return true;
  } catch (error) {
    console.error("❌ Email Error Details:");
    console.error("   Error Message:", error.message);
    console.error("   Error Code:", error.code || "N/A");
    
    const errorDetails = {
      message: error.message,
      code: error.code || "UNKNOWN_ERROR",
      responseCode: error.responseCode,
      response: error.response,
      command: error.command,
    };
    
    if (error.code === "EAUTH") {
      console.error("   ⚠️  Authentication failed!");
      console.error("   Please check:");
      console.error("   1. EMAIL_USER is correct");
      console.error("   2. EMAIL_PASS is correct (use App Password for Gmail)");
      console.error("   3. 2-Factor Authentication is enabled (for Gmail)");
      errorDetails.details = "Authentication failed. For Gmail, use an App Password, not your regular password.";
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error("   ⚠️  Connection failed!");
      console.error("   Please check:");
      console.error("   1. EMAIL_HOST is correct");
      console.error("   2. EMAIL_PORT is correct");
      console.error("   3. Internet connection is working");
      console.error("   4. Firewall is not blocking the connection");
      errorDetails.details = "Connection to SMTP server failed. Check network and firewall settings.";
    } else if (error.response) {
      console.error("   ⚠️  SMTP Server Response:");
      console.error("   Code:", error.responseCode);
      console.error("   Message:", error.response);
      errorDetails.details = `SMTP server responded with: ${error.response}`;
    }
    
    console.error("   Full Error:", error);
    
    if (returnDetails) {
      return { success: false, error: errorDetails };
    }
    return false;
  }
};

module.exports = sendEmail;
