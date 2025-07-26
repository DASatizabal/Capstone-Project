import { Resend } from "resend";

import { renderWelcomeEmail } from "@/components/emails/WelcomeEmail";
import config from "@/config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Centralized email service
export const emailService = {
  /**
   * Send a welcome email to a new user
   */
  sendWelcomeEmail: async (to: string, name: string) => {
    try {
      const html = await renderWelcomeEmail({
        name,
        appName: config.appName,
        dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      });

      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [to],
        subject: `Welcome to ${config.appName}!`,
        html,
      });

      if (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error };
    }
  },
  /* sendWelcomeEmail: async (to: string, name: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [to],
        subject: `Welcome to ${config.appName}!`,
        html: `
          <h1>Welcome to ${config.appName}, ${name}!</h1>
          <p>We're excited to have you on board.</p>
          <p>If you have any questions, feel free to reply to this email.</p>
        `,
      });
      
      if (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }
  }, */

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail: async (to: string, resetLink: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [to],
        subject: `Reset your ${config.appName} password`,
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });

      if (error) {
        console.error("Error sending password reset email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send a notification email
   */
  sendNotificationEmail: async (
    to: string,
    subject: string,
    message: string,
  ) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [to],
        subject,
        html: `
          <h2>${subject}</h2>
          <div>${message}</div>
        `,
      });

      if (error) {
        console.error("Error sending notification email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Failed to send notification email:", error);
      return { success: false, error };
    }
  },
};
