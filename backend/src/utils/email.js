import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a password reset email with a tokenized link.
 * @param {string} to - Recipient email address
 * @param {string} resetToken - The raw reset token
 * @param {string} companyName - The company name for context
 */
export async function sendPasswordResetEmail(to, resetToken, companyName) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Lot Walker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request – Lot Walker',
    html: `
      <p>Hello,</p>
      <p>You requested a password reset for your Lot Walker account at <strong>${companyName}</strong>.</p>
      <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— The Lot Walker Team</p>
    `,
  });
}

/**
 * Send a department notification email when a new issue is created.
 * @param {string} to - Department notification email
 * @param {object} issue - The issue object
 * @param {object} vehicle - The vehicle object
 */
export async function sendIssueNotificationEmail(to, issue, vehicle) {
  await transporter.sendMail({
    from: `"Lot Walker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `New Issue: ${vehicle.year || ''} ${vehicle.make} ${vehicle.model} – ${vehicle.vin}`,
    html: `
      <p>A new issue has been logged for a vehicle on your lot.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:4px 8px;font-weight:bold">VIN</td><td style="padding:4px 8px">${vehicle.vin}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">Stock #</td><td style="padding:4px 8px">${vehicle.stock_number || 'N/A'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">Vehicle</td><td style="padding:4px 8px">${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">Issue</td><td style="padding:4px 8px">${issue.description}</td></tr>
      </table>
      <p>Log in to Lot Walker to view and assign this issue.</p>
    `,
  });
}
