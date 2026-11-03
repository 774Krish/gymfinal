const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} verificationToken - Unique verification token
 * @param {string} firstName - User's first name
 * @returns {Promise} - Result of email send operation
 */
async function sendVerificationEmail(email, verificationToken, firstName = 'User') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationLink = `${frontendUrl}/verify-email.html?token=${verificationToken}`;
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(150deg, #5b9dff, #a78bfa); padding: 20px; border-radius: 8px; color: white; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #5b9dff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { font-size: 12px; color: #666; text-align: center; padding: 20px 0; border-top: 1px solid #ddd; }
        .code-block { background: #f0f0f0; padding: 10px; border-left: 4px solid #5b9dff; margin: 10px 0; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Renewal Radar</h1>
        </div>
        
        <div class="content">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for signing up for Renewal Radar. We're excited to have you on board!</p>
          
          <p>To complete your registration, please verify your email address by clicking the button below:</p>
          
          <p style="text-align: center;">
            <a href="${verificationLink}" class="button">
              Verify Email Address
            </a>
          </p>
          
          <p>Or copy and paste this link in your browser:</p>
          <div class="code-block">${verificationLink}</div>
          
          <p><strong>⏱️  This link expires in 24 hours.</strong></p>
          
          <hr>
          
          <p style="font-size: 12px; color: #666;">
            If you didn't sign up for Renewal Radar, please ignore this email. Your account will not be activated without email verification.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 Renewal Radar. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@renewalradar.com',
      to: email,
      subject: 'Verify Your Renewal Radar Email Address',
      html: htmlTemplate,
      text: `Welcome to Renewal Radar!\n\nVerify your email: ${verificationLink}\n\nThis link expires in 24 hours.`
    });

    console.log('Email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Result of email send operation
 */
async function sendPasswordResetEmail(email, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password.html?token=${resetToken}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(150deg, #5b9dff, #a78bfa); padding: 20px; border-radius: 8px; color: white; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #f0555f; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { font-size: 12px; color: #666; text-align: center; padding: 20px 0; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Renewal Radar</h1>
        </div>
        
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">
              Reset Password
            </a>
          </p>
          
          <p><strong>⏱️  This link expires in 1 hour.</strong></p>
          
          <p style="font-size: 12px; color: #666;">
            If you didn't request a password reset, please ignore this email. Your account will remain unchanged.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 Renewal Radar. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@renewalradar.com',
      to: email,
      subject: 'Reset Your Renewal Radar Password',
      html: htmlTemplate,
      text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour.`
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
