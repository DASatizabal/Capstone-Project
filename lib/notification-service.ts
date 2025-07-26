// lib/notification-service.ts
import { Resend } from "resend";

import {
  renderChoreAssignmentEmail,
  renderChoreReminderEmail,
  renderChoreCompletionEmail,
  renderPhotoApprovalEmail,
  renderPhotoRejectionEmail,
} from "@/components/emails/ChoreEmails";
import config from "@/config";
import dbConnect from "@/lib/dbConnect";
import NotificationLog from "@/models/NotificationLog";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NotificationPreferences {
  email: boolean;
  choreAssignments: boolean;
  choreReminders: boolean;
  choreCompletions: boolean;
  photoApprovals: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

export interface ChoreNotificationData {
  choreId: string;
  choreTitle: string;
  choreDescription?: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  };
  assignedBy: {
    id: string;
    name: string;
    email: string;
  };
  family: {
    id: string;
    name: string;
  };
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  points: number;
  requiresPhotoVerification: boolean;
}

export interface PhotoNotificationData extends ChoreNotificationData {
  photoUrl: string;
  rejectionReason?: string;
}

// Helper function to create notification log
async function createNotificationLog(data: {
  userId: string;
  familyId?: string;
  choreId?: string;
  type: string;
  recipient: string;
  subject: string;
  metadata?: any;
}) {
  try {
    await dbConnect();
    return await NotificationLog.createLog({
      user: data.userId,
      family: data.familyId,
      chore: data.choreId,
      type: data.type as any,
      recipient: data.recipient,
      subject: data.subject,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error("Error creating notification log:", error);
    return null;
  }
}

// Helper function to send email with logging
async function sendEmailWithLogging(
  emailData: any,
  logData: {
    userId: string;
    familyId?: string;
    choreId?: string;
    type: string;
    recipient: string;
    subject: string;
    metadata?: any;
  },
) {
  // Create log entry
  const log = await createNotificationLog(logData);

  try {
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      // Mark as failed in log
      if (log) {
        await log.markAsFailed({
          message: error.message || "Unknown error",
          code: error.name,
          details: error,
        });
      }
      return { success: false, error, logId: log?._id };
    }

    // Mark as sent in log
    if (log) {
      await log.markAsSent(data?.id, data);
    }

    return { success: true, data, logId: log?._id };
  } catch (error) {
    // Mark as failed in log
    if (log) {
      await log.markAsFailed({
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
      });
    }
    return { success: false, error, logId: log?._id };
  }
}

// Centralized notification service
export const notificationService = {
  /**
   * Send chore assignment notification
   */
  sendChoreAssignmentNotification: async (data: ChoreNotificationData) => {
    try {
      const html = await renderChoreAssignmentEmail({
        choreTitle: data.choreTitle,
        choreDescription: data.choreDescription || "",
        assignedToName: data.assignedTo.name,
        assignedByName: data.assignedBy.name,
        familyName: data.family.name,
        dueDate: data.dueDate,
        priority: data.priority,
        points: data.points,
        requiresPhotoVerification: data.requiresPhotoVerification,
        choreUrl: `${process.env.NEXTAUTH_URL}/chores/${data.choreId}`,
        appName: config.appName,
      });

      const subject = `New Chore Assigned: ${data.choreTitle}`;

      return await sendEmailWithLogging(
        {
          from: config.resend.fromAdmin,
          to: [data.assignedTo.email],
          subject,
          html,
        },
        {
          userId: data.assignedTo.id,
          familyId: data.family.id,
          choreId: data.choreId,
          type: "chore_assignment",
          recipient: data.assignedTo.email,
          subject,
          metadata: {
            choreTitle: data.choreTitle,
            priority: data.priority,
            points: data.points,
            familyName: data.family.name,
            assignedByName: data.assignedBy.name,
            requiresPhotoVerification: data.requiresPhotoVerification,
          },
        },
      );
    } catch (error) {
      console.error("Failed to send chore assignment notification:", error);
      return { success: false, error };
    }
  },

  /**
   * Send chore reminder notification
   */
  sendChoreReminderNotification: async (
    data: ChoreNotificationData & { daysUntilDue: number },
  ) => {
    try {
      const html = await renderChoreReminderEmail({
        choreTitle: data.choreTitle,
        choreDescription: data.choreDescription || "",
        assignedToName: data.assignedTo.name,
        familyName: data.family.name,
        dueDate: data.dueDate!,
        daysUntilDue: data.daysUntilDue,
        priority: data.priority,
        points: data.points,
        choreUrl: `${process.env.NEXTAUTH_URL}/chores/${data.choreId}`,
        appName: config.appName,
      });

      const { data: emailData, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [data.assignedTo.email],
        subject: `Reminder: ${data.choreTitle} ${data.daysUntilDue === 0 ? "is due today!" : `due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? "" : "s"}`}`,
        html,
      });

      if (error) {
        console.error("Error sending chore reminder email:", error);
        return { success: false, error };
      }

      return { success: true, data: emailData };
    } catch (error) {
      console.error("Failed to send chore reminder notification:", error);
      return { success: false, error };
    }
  },

  /**
   * Send chore completion notification to parents
   */
  sendChoreCompletionNotification: async (
    data: ChoreNotificationData,
    parentEmails: string[],
  ) => {
    try {
      const html = await renderChoreCompletionEmail({
        choreTitle: data.choreTitle,
        choreDescription: data.choreDescription || "",
        completedByName: data.assignedTo.name,
        familyName: data.family.name,
        points: data.points,
        requiresPhotoVerification: data.requiresPhotoVerification,
        choreUrl: `${process.env.NEXTAUTH_URL}/chores/${data.choreId}`,
        appName: config.appName,
      });

      const emailPromises = parentEmails.map((email) =>
        resend.emails.send({
          from: config.resend.fromAdmin,
          to: [email],
          subject: `${data.assignedTo.name} completed: ${data.choreTitle}`,
          html,
        }),
      );

      const results = await Promise.allSettled(emailPromises);
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        console.error("Some completion emails failed:", failures);
      }

      return {
        success: failures.length === 0,
        sentCount: results.length - failures.length,
        totalRecipients: parentEmails.length,
      };
    } catch (error) {
      console.error("Failed to send chore completion notifications:", error);
      return { success: false, error };
    }
  },

  /**
   * Send photo approval notification
   */
  sendPhotoApprovalNotification: async (data: PhotoNotificationData) => {
    try {
      const html = await renderPhotoApprovalEmail({
        choreTitle: data.choreTitle,
        childName: data.assignedTo.name,
        familyName: data.family.name,
        points: data.points,
        photoUrl: data.photoUrl,
        choreUrl: `${process.env.NEXTAUTH_URL}/chores/${data.choreId}`,
        appName: config.appName,
      });

      const { data: emailData, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [data.assignedTo.email],
        subject: `Photo Approved: ${data.choreTitle} ✅`,
        html,
      });

      if (error) {
        console.error("Error sending photo approval email:", error);
        return { success: false, error };
      }

      return { success: true, data: emailData };
    } catch (error) {
      console.error("Failed to send photo approval notification:", error);
      return { success: false, error };
    }
  },

  /**
   * Send photo rejection notification
   */
  sendPhotoRejectionNotification: async (data: PhotoNotificationData) => {
    try {
      const html = await renderPhotoRejectionEmail({
        choreTitle: data.choreTitle,
        childName: data.assignedTo.name,
        familyName: data.family.name,
        rejectionReason: data.rejectionReason || "Please retake the photo",
        photoUrl: data.photoUrl,
        choreUrl: `${process.env.NEXTAUTH_URL}/chores/${data.choreId}`,
        appName: config.appName,
      });

      const { data: emailData, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [data.assignedTo.email],
        subject: `Photo Needs Retaking: ${data.choreTitle} 📷`,
        html,
      });

      if (error) {
        console.error("Error sending photo rejection email:", error);
        return { success: false, error };
      }

      return { success: true, data: emailData };
    } catch (error) {
      console.error("Failed to send photo rejection notification:", error);
      return { success: false, error };
    }
  },

  /**
   * Send daily digest to parents
   */
  sendDailyDigest: async (
    parentEmail: string,
    familyName: string,
    digest: {
      completedChores: Array<{
        title: string;
        completedBy: string;
        points: number;
      }>;
      overdueChores: Array<{
        title: string;
        assignedTo: string;
        daysOverdue: number;
      }>;
      pendingApprovals: number;
      totalPointsEarned: number;
    },
  ) => {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Daily Family Summary - ${familyName}</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📊 Today's Stats</h3>
            <ul>
              <li><strong>${digest.completedChores.length}</strong> chores completed</li>
              <li><strong>${digest.totalPointsEarned}</strong> points earned</li>
              <li><strong>${digest.overdueChores.length}</strong> chores overdue</li>
              <li><strong>${digest.pendingApprovals}</strong> photos awaiting approval</li>
            </ul>
          </div>

          ${
            digest.completedChores.length > 0
              ? `
          <div style="margin: 20px 0;">
            <h3>✅ Completed Chores</h3>
            <ul>
              ${digest.completedChores
                .map(
                  (chore) =>
                    `<li><strong>${chore.title}</strong> by ${chore.completedBy} (+${chore.points} points)</li>`,
                )
                .join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            digest.overdueChores.length > 0
              ? `
          <div style="margin: 20px 0;">
            <h3>⚠️ Overdue Chores</h3>
            <ul>
              ${digest.overdueChores
                .map(
                  (chore) =>
                    `<li><strong>${chore.title}</strong> assigned to ${chore.assignedTo} (${chore.daysOverdue} days overdue)</li>`,
                )
                .join("")}
            </ul>
          </div>
          `
              : ""
          }

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Dashboard
              </a>
            </p>
          </div>
        </div>
      `;

      const { data: emailData, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [parentEmail],
        subject: `Daily Family Summary - ${familyName}`,
        html,
      });

      if (error) {
        console.error("Error sending daily digest:", error);
        return { success: false, error };
      }

      return { success: true, data: emailData };
    } catch (error) {
      console.error("Failed to send daily digest:", error);
      return { success: false, error };
    }
  },

  /**
   * Send test notification (for debugging)
   */
  sendTestNotification: async (to: string, type: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [to],
        subject: `Test Notification - ${type}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Notification</h2>
            <p>This is a test notification of type: <strong>${type}</strong></p>
            <p>Sent at: ${new Date().toISOString()}</p>
            <p>If you received this, your notification system is working correctly!</p>
          </div>
        `,
      });

      if (error) {
        console.error("Error sending test notification:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return { success: false, error };
    }
  },
};
