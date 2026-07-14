import nodemailer from 'nodemailer';
import config from './env.js';

let transporter = null;

if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT == 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
  console.log('📧 SMTP transporter configured.');
} else {
  console.warn('📧 SMTP not configured — emails will be logged but not sent.');
}

/**
 * Send an email. Gracefully handles missing SMTP configuration.
 * @returns {{ success: boolean, error?: string }}
 */
export const sendMail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`📧 [NO-OP] Would send email to ${to}: "${subject}"`);
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    await transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: "${subject}"`);
    return { success: true };
  } catch (error) {
    console.error(`📧 Email failed to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default transporter;
