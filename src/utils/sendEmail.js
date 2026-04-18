import { Resend } from "resend";
import { environmentVariables } from "../config/config.env.js";

const resend = new Resend(environmentVariables.RESEND_API_KEY);

const APP_URL =
  environmentVariables.APP_URL || "https://freeze-dried-fruit-store.vercel.app";
const LOGO_URL = `${APP_URL}/logo.png`;

const getVerificationEmailTemplate = ({ name, verifyUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email – The Dry Factory</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { padding: 20px !important; }
            .header img { width: 80px !important; height: auto !important; }
            .hero-title { font-size: 24px !important; }
            .content-text { font-size: 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9f6; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid #f0ede8;">
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;" class="header">
                            <img src="${LOGO_URL}" alt="The Dry Factory" width="100" height="100" style="display: block; margin-bottom: 20px; border-radius: 50%; border: 2px solid #fdf3ec;">
                            <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.02em;">
                                The Dry <span style="color: #e85d26;">Factory</span>
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <div style="background-color: #fdf3ec; border-radius: 16px; padding: 32px 24px; border: 1px solid #f0d9c8;">
                                <h2 class="hero-title" style="margin: 0 0 12px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                                    Hi ${name} 👋
                                </h2>
                                <p class="content-text" style="margin: 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                    Welcome to the family! We're excited to have you join us in choosing cleaner, smarter, and honestly healthy habits.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <p class="content-text" style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                                Only one step remains to activate your account. Please verify your email address by clicking the button below.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#e85d26" style="border-radius: 100px;">
                                        <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 18px 36px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none;">
                                            Verify My Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0 0; font-size: 13px; color: #9a8a7a; font-style: italic;">
                                This link expires in 24 hours for your security.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px; background-color: #faf9f6; border-top: 1px solid #f0ede8;">
                            <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #e85d26;">
                                Why The Dry Factory?
                            </p>
                            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #6a5a4a; line-height: 1.5;">
                                Honest Food. Real Fruit. Zero Compromise.<br>
                                <span style="font-size: 12px; color: #9a8a7a;">Naturally Crafted for a Healthier Everyday.</span>
                            </p>
                        </td>
                    </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin-top: 24px;">
                    <tr>
                        <td align="center" style="padding: 0 20px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #9a8a7a; line-height: 1.6;">
                                You received this email because you signed up for The Dry Factory. If this wasn't you, please ignore this email.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}" style="font-size: 13px; color: #1a1a1a; text-decoration: none; font-weight: 600;">Website</a></td>
                                    <td style="padding: 0 8px; color: #d1cdc7;">|</td>
                                    <td style="padding: 0 8px;"><a href="https://instagram.com/thedryfactory" style="font-size: 13px; color: #1a1a1a; text-decoration: none; font-weight: 600;">Instagram</a></td>
                                    <td style="padding: 0 8px; color: #d1cdc7;">|</td>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}/contact" style="font-size: 13px; color: #1a1a1a; text-decoration: none; font-weight: 600;">Support</a></td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0 0; font-size: 12px; color: #b0a69b;">
                                &copy; ${new Date().getFullYear()} The Dry Factory. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev", // change to your verified domain
    to,
    subject: "Verify your email – The Dry Factory",
    html: getVerificationEmailTemplate({ name, verifyUrl }),
  });

  if (error) throw new Error(error.message);
  return data;
};
