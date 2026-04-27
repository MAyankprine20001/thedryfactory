const APP_URL =
  process.env.APP_URL || "https://freeze-dried-fruit-store.vercel.app";
const LOGO_URL =
  "https://res.cloudinary.com/doi7id29n/image/upload/q_auto/f_auto/v1776528652/logo_2_on76wp.png";

// ─── CTA Button ───────────────────────────────────────────────────────────────
const ctaButton = ({ url, text }) => `
<table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td align="center" bgcolor="#b8860b" style="border-radius: 100px;">
            <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.5px; border-radius: 100px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                ${text}
            </a>
        </td>
    </tr>
</table>
`;

const divider = () => `
<tr>
    <td style="padding: 0 40px;">
        <div style="height: 1px; background-color: #333333; width: 100%;"></div>
    </td>
</tr>
`;

const baseTemplate = ({ previewText, bodyContent }) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${previewText}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        :root { color-scheme: light; supported-color-schemes: light; }
        body, html, table, td, div, p, a {
            margin: 0 !important;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        body {
            background-color: #f4efe8 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        @media only screen and (max-width: 600px) {
            .main-card { width: 100% !important; border-radius: 0 !important; }
            .inner-pad { padding: 24px !important; }
            .logo-img { width: 130px !important; height: 130px !important; }
            .hero-title { font-size: 22px !important; }
            .body-text { font-size: 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4efe8; width: 100%;">

<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4efe8;"><tr><td><![endif]-->

<div style="background-color: #f4efe8; width: 100%; margin: 0; padding: 48px 16px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4efe8;">
        <tr>
            <td align="center" style="background-color: #f4efe8;">

                <!-- ─── MAIN CARD ─── -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="560" class="main-card" style="max-width: 560px; width: 100%; background-color: #000000; border-radius: 20px; border: 1px solid #333333; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">

                    <!-- HEADER -->
                    <tr>
                        <td align="center" style="padding: 48px 40px 32px 40px; background-color: #000000;">
                            <img src="${LOGO_URL}" alt="The Dry Factory" width="160" height="160" class="logo-img" style="display: block; margin: 0 auto 24px auto; border-radius: 50%; background-color: #000000; border: none;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, 'Times New Roman', serif;">
                                The Dry <span style="color: #b8860b;">Factory</span>
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 12px; color: #aaaaaa; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 600;">
                                Premium Freeze Dried Foods
                            </p>
                        </td>
                    </tr>

                    ${divider()}

                    <!-- DYNAMIC CONTENT -->
                    ${bodyContent}

                    ${divider()}

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; background-color: #111111;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #b8860b;">
                                The Dry Factory
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 13px; color: #aaaaaa; line-height: 1.5;">
                                Honest Food. Real Fruit. Zero Compromise.
                            </p>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="${APP_URL}" style="font-size: 12px; color: #aaaaaa; text-decoration: none; font-weight: 600; letter-spacing: 0.5px;">Website</a>
                                    </td>
                                    <td style="color: #444444; font-size: 12px;">•</td>
                                    <td style="padding: 0 10px;">
                                        <a href="https://instagram.com/thedryfactory" style="font-size: 12px; color: #aaaaaa; text-decoration: none; font-weight: 600; letter-spacing: 0.5px;">Instagram</a>
                                    </td>
                                    <td style="color: #444444; font-size: 12px;">•</td>
                                    <td style="padding: 0 10px;">
                                        <a href="${APP_URL}/contact" style="font-size: 12px; color: #aaaaaa; text-decoration: none; font-weight: 600; letter-spacing: 0.5px;">Support</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- ─── END CARD ─── -->

                <!-- BOTTOM NOTE -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 0 20px 40px 20px;">
                            <p style="font-size: 12px; color: #999999; line-height: 1.7; margin: 0; text-align: center;">
                                You received this because you created an account at The Dry Factory.<br>
                                If this wasn't you, please ignore this email.
                            </p>
                            <p style="font-size: 11px; color: #aaaaaa; margin: 12px 0 0 0; text-align: center;">
                                &copy; ${new Date().getFullYear()} The Dry Factory. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</div>

<!--[if mso | IE]></td></tr></table><![endif]-->

</body>
</html>
`;

// ─── 1. Email Verification ────────────────────────────────────────────────────
export const verificationEmailTemplate = ({ name, verifyUrl }) =>
  baseTemplate({
    previewText: "Verify your email - The Dry Factory",
    bodyContent: `
      <tr>
        <td align="left" style="padding: 36px 40px 20px 40px; background-color: #000000;" class="inner-pad">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 2px; text-transform: uppercase;">
            Welcome
          </p>
          <h2 class="hero-title" style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; line-height: 1.2;">
            Hi ${name} 👋
          </h2>
          <p class="body-text" style="margin: 0; font-size: 16px; line-height: 1.7; color: #aaaaaa;">
            Welcome to the family! We're excited to have you join us in choosing cleaner, smarter, and honestly healthy habits.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 40px 0 40px; background-color: #000000;" class="inner-pad">
          <div style="background-color: #111111; border-radius: 12px; padding: 24px; border: 1px solid #333333; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 1.5px; text-transform: uppercase;">
              Action Required
            </p>
            <p style="margin: 0; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
              Please verify your email address to activate your account and start shopping.
            </p>
          </div>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 32px 40px 56px 40px; background-color: #000000;" class="inner-pad">
          ${ctaButton({ url: verifyUrl, text: "Verify My Email Address" })}
          <p style="margin: 24px 0 0 0; font-size: 12px; color: #666666; font-style: italic; text-align: center;">
            This link expires in 24 hours for your security.
          </p>
        </td>
      </tr>
    `,
  });

// ─── 2. Password Reset ────────────────────────────────────────────────────────
export const passwordResetEmailTemplate = ({ name, resetUrl }) =>
  baseTemplate({
    previewText: "Reset your password - The Dry Factory",
    bodyContent: `
      <tr>
        <td align="left" style="padding: 36px 40px 20px 40px; background-color: #000000;" class="inner-pad">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 2px; text-transform: uppercase;">
            Password Reset
          </p>
          <h2 class="hero-title" style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; line-height: 1.2;">
            Hi ${name} 👋
          </h2>
          <p class="body-text" style="margin: 0; font-size: 16px; line-height: 1.7; color: #aaaaaa;">
            We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 40px 0 40px; background-color: #000000;" class="inner-pad">
          <div style="background-color: #111111; border-radius: 12px; padding: 24px; border: 1px solid #333333; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 1.5px; text-transform: uppercase;">
              Action Required
            </p>
            <p style="margin: 0; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
              Click the button below to set a new password. This link is valid for 1 hour only.
            </p>
          </div>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 32px 40px 56px 40px; background-color: #000000;" class="inner-pad">
          ${ctaButton({ url: resetUrl, text: "Reset My Password" })}
          <p style="margin: 24px 0 0 0; font-size: 12px; color: #666666; font-style: italic; text-align: center;">
            This link expires in 1 hour for your security.
          </p>
        </td>
      </tr>
    `,
  });

// ─── 3. Order Confirmation ────────────────────────────────────────────────────
export const orderConfirmEmailTemplate = ({ name, orderId, orderUrl }) =>
  baseTemplate({
    previewText: `Order Confirmed #${orderId} - The Dry Factory`,
    bodyContent: `
      <tr>
        <td align="left" style="padding: 36px 40px 20px 40px; background-color: #000000;" class="inner-pad">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 2px; text-transform: uppercase;">
            Order Confirmed
          </p>
          <h2 class="hero-title" style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; line-height: 1.2;">
            Thank you, ${name}! 🎉
          </h2>
          <p class="body-text" style="margin: 0; font-size: 16px; line-height: 1.7; color: #aaaaaa;">
            Your order has been confirmed and is now being prepared with care.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 40px 0 40px; background-color: #000000;" class="inner-pad">
          <div style="background-color: #111111; border-radius: 12px; padding: 24px; border: 1px solid #333333; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 1.5px; text-transform: uppercase;">
              Order Details
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; font-family: Georgia, serif;">
              #${orderId}
            </p>
          </div>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 32px 40px 56px 40px; background-color: #000000;" class="inner-pad">
          ${ctaButton({ url: orderUrl, text: "View My Order" })}
        </td>
      </tr>
    `,
  });

// ─── 4. Admin — New User Registration Notification ───────────────────────────
export const adminNewUserEmailTemplate = ({ name, email, joinedAt }) =>
  baseTemplate({
    previewText: `New customer registered: ${name} – The Dry Factory`,
    bodyContent: `
      <tr>
        <td align="left" style="padding: 36px 40px 20px 40px; background-color: #000000;" class="inner-pad">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 2px; text-transform: uppercase;">
            New Customer
          </p>
          <h2 class="hero-title" style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; line-height: 1.2;">
            A new user just signed up! 🎉
          </h2>
          <p class="body-text" style="margin: 0; font-size: 16px; line-height: 1.7; color: #aaaaaa;">
            Someone just created an account on The Dry Factory store.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 40px 0 40px; background-color: #000000;" class="inner-pad">
          <div style="background-color: #111111; border-radius: 12px; padding: 24px; border: 1px solid #333333; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b8860b; letter-spacing: 1.5px; text-transform: uppercase;">
              Customer Details
            </p>
            <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #888888; width: 100px;">Name</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #888888;">Email</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 600;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #888888;">Joined</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 600;">${joinedAt}</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 32px 40px 56px 40px; background-color: #000000;" class="inner-pad">
          ${ctaButton({ url: '${process.env.ADMIN_URL || "http://localhost:5173"}/admin/customers', text: "View Customers" })}
        </td>
      </tr>
    `,
  });
