import nodemailer from "nodemailer";

// Configure transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT, // e.g., 587
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Simple HTML escaper for user-controlled content in email templates
 */
const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * EMAIL 1 — Subscription Activated
 */
export const sendSubscriptionActivatedEmail = async (user, planName, startDate, endDate) => {
  if (!user || (typeof user.email !== 'string' || !user.email) || !process.env.SMTP_HOST || !process.env.SMTP_USER) {
    const reason = !user ? "user" : ((typeof user.email !== 'string' || !user.email) ? "valid user email" : "SMTP configuration (HOST/USER)");
    console.warn(`⚠️ ${reason} missing. Skipping activation email.`);
    return;
  }

  try {
    const formattedStart = new Date(startDate).toLocaleDateString("en-IN");
    const formattedEnd = new Date(endDate).toLocaleDateString("en-IN");

    const safeName = escapeHtml(user.displayName) || "Customer";
    const safePlan = escapeHtml(planName);
    const safeStart = escapeHtml(formattedStart);
    const safeEnd = escapeHtml(formattedEnd);

    await transporter.sendMail({
      from: `"QR Menu Support" <${process.env.SMTP_FROM || 'support@qrmenu.com'}>`,
      to: user.email,
      subject: "Your QR Menu Subscription is Active",
      text: `Hello ${user.displayName || "Customer"},\n\nYour QR Menu subscription has been successfully activated.\n\nPlan: ${planName}\nStart Date: ${formattedStart}\nExpiry Date: ${formattedEnd}\n\nThank you for using our service.\n\nBest,\nQR Menu Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Subscription Activated 🎉</h2>
          <p>Hello ${safeName},</p>
          <p>Your QR Menu subscription has been successfully activated.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Plan:</strong> ${safePlan}</p>
            <p><strong>Start Date:</strong> ${safeStart}</p>
            <p><strong>Expiry Date:</strong> ${safeEnd}</p>
          </div>
          <p>Thank you for using our service. Your digital menu is now instantly accessible to all your customers without interruptions.</p>
          <br>
          <p>Best regards,<br>The QR Menu Team</p>
        </div>
      `,
    });
    console.log(`✉️ Activation email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Failed to send activation email:", error.message);
  }
};

/**
 * EMAIL 2 — Expiry Reminder
 */
export const sendExpiryReminderEmail = async (user, daysLeft) => {
  if (!user || (typeof user.email !== 'string' || !user.email) || !process.env.SMTP_HOST || !process.env.SMTP_USER) {
    const reason = !user ? "user" : ((typeof user.email !== 'string' || !user.email) ? "valid user email" : "SMTP configuration (HOST/USER)");
    console.warn(`⚠️ ${reason} missing. Skipping expiry reminder email.`);
    return;
  }

  try {
    const safeName = escapeHtml(user.displayName) || "Customer";

    await transporter.sendMail({
      from: `"QR Menu Support" <${process.env.SMTP_FROM || 'support@qrmenu.com'}>`,
      to: user.email,
      subject: "Your QR Menu Subscription is Expiring Soon",
      text: `Hello ${user.displayName || "Customer"},\n\nYour QR Menu subscription will expire in ${daysLeft} days.\n\nRenew now to keep your menu accessible to customers.\n\nBest,\nQR Menu Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #f59e0b;">Subscription Expiring Soon ⏰</h2>
          <p>Hello ${safeName},</p>
          <p>This is a quick reminder that your QR Menu subscription will expire in <strong>${daysLeft} days</strong>.</p>
          <p>To avoid any service interruption and keep your menu accessible to your customers, please log in to your dashboard and renew your subscription.</p>
          <br>
          <p>Best regards,<br>The QR Menu Team</p>
        </div>
      `,
    });
    console.log(`✉️ Reminder email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Failed to send reminder email:", error.message);
  }
};

/**
 * EMAIL 3 — Subscription Expired
 */
export const sendSubscriptionExpiredEmail = async (user) => {
  if (!user || (typeof user.email !== 'string' || !user.email) || !process.env.SMTP_HOST || !process.env.SMTP_USER) {
    const reason = !user ? "user" : ((typeof user.email !== 'string' || !user.email) ? "valid user email" : "SMTP configuration (HOST/USER)");
    console.warn(`⚠️ ${reason} missing. Skipping subscription expired email.`);
    return;
  }

  try {
    const safeName = escapeHtml(user.displayName) || "Customer";

    await transporter.sendMail({
      from: `"QR Menu Support" <${process.env.SMTP_FROM || 'support@qrmenu.com'}>`,
      to: user.email,
      subject: "Your QR Menu Subscription Has Expired",
      text: `Hello ${user.displayName || "Customer"},\n\nYour subscription has expired.\n\nYour public menu is currently inaccessible to customers.\n\nPlease renew your subscription to restore service.\n\nBest,\nQR Menu Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #ef4444;">Subscription Expired 🔴</h2>
          <p>Hello ${safeName},</p>
          <p>We are writing to let you know that your QR Menu subscription has officially expired.</p>
          <div style="background-color: #fef2f2; color: #991b1b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Your public menu is currently inaccessible to customers.</p>
          </div>
          <p>You can quickly restore your service and bring your menu back online by renewing your subscription from your dashboard.</p>
          <br>
          <p>Best regards,<br>The QR Menu Team</p>
        </div>
      `,
    });
    console.log(`✉️ Expired email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Failed to send expired email:", error.message);
  }
};
