import { Resend } from "resend";
import crypto from "crypto";
import { environmentVariables } from "../config/config.env.js";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  orderConfirmEmailTemplate,
} from "./emailTemplates.js";

const resend = new Resend(environmentVariables.RESEND_API_KEY);
const FROM = `The Dry Factory <${environmentVariables.RESEND_FROM_EMAIL}>`;
const sendEmail = async ({ to, subject, html, text }) => {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text, // ✅ plain text fallback
    headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    tags: [{ name: "category", value: "transactional" }],
  });

  if (error) throw new Error(error.message);
  return data;
};

// ─── 1. Verification email ────────────────────────────────────────────────────
export const sendVerificationEmail = ({ to, name, verifyUrl }) =>
  sendEmail({
    to,
    subject: "Verify your email – The Dry Factory",
    html: verificationEmailTemplate({ name, verifyUrl }),
    text: `Hi ${name},\n\nWelcome to The Dry Factory! Please verify your email by visiting:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nThanks,\nThe Dry Factory Team`,
  });

// ─── 2. Password reset email ──────────────────────────────────────────────────
export const sendPasswordResetEmail = ({ to, name, resetUrl }) =>
  sendEmail({
    to,
    subject: "Reset your password – The Dry Factory",
    html: passwordResetEmailTemplate({ name, resetUrl }),
    text: `Hi ${name},\n\nReset your password by visiting:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\nThanks,\nThe Dry Factory Team`,
  });

// ─── 3. Order confirmation email ──────────────────────────────────────────────
export const sendOrderConfirmEmail = ({ to, name, orderId, orderUrl }) =>
  sendEmail({
    to,
    subject: `Order Confirmed #${orderId} – The Dry Factory`,
    html: orderConfirmEmailTemplate({ name, orderId, orderUrl }),
    text: `Hi ${name},\n\nYour order #${orderId} has been confirmed!\n\nView your order:\n${orderUrl}\n\nThanks,\nThe Dry Factory Team`,
  });