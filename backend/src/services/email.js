import nodemailer from 'nodemailer';

const transport = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com', port: Number(process.env.EMAIL_PORT || 587), secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
}) : null;
export async function sendEmail({ to, subject, html }) {
  if (!transport) return console.warn(`[email skipped] ${subject} → ${to}. Configure EMAIL_USER and EMAIL_PASSWORD.`);
  try { await transport.sendMail({ from: `Farm2Market <${process.env.EMAIL_USER}>`, to, subject, html }); }
  catch (error) { console.error('Email delivery error:', error.message); }
}
export const emailLayout = (title, content) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;background:#f4f8f2"><h1 style="color:#166534">Farm2Market</h1><h2>${title}</h2>${content}<p style="color:#52705b">Farm fresh. Business ready.</p></div>`;
