// components/emails/ChoreEmails.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

// Common styles
const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const headingStyle = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const textStyle = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "10px",
};

const buttonStyle = {
  backgroundColor: "#0070f3",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 30px",
  textDecoration: "none",
};

const priorityColors = {
  low: "#28a745",
  medium: "#ffc107",
  high: "#dc3545",
};

// Chore Assignment Email Template
interface ChoreAssignmentEmailProps {
  choreTitle: string;
  choreDescription: string;
  assignedToName: string;
  assignedByName: string;
  familyName: string;
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  points: number;
  requiresPhotoVerification: boolean;
  choreUrl: string;
  appName: string;
}

export const ChoreAssignmentEmail = (props: ChoreAssignmentEmailProps) => {
  const priorityEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🔴",
  };

  return (
    <Html>
      <Head />
      <Preview>New chore assigned: {props.choreTitle}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>📝 New Chore Assigned!</Heading>

          <Text style={textStyle}>Hi {props.assignedToName},</Text>

          <Text style={textStyle}>
            {props.assignedByName} has assigned you a new chore in the{" "}
            {props.familyName} family.
          </Text>

          <Section
            style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              border: `3px solid ${priorityColors[props.priority]}`,
            }}
          >
            <Text
              style={{
                ...textStyle,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              {props.choreTitle}
            </Text>

            {props.choreDescription && (
              <Text style={textStyle}>{props.choreDescription}</Text>
            )}

            <Text style={textStyle}>
              <strong>Priority:</strong> {priorityEmoji[props.priority]}{" "}
              {props.priority.charAt(0).toUpperCase() + props.priority.slice(1)}
            </Text>

            <Text style={textStyle}>
              <strong>Points:</strong> {props.points} 🌟
            </Text>

            {props.dueDate && (
              <Text style={textStyle}>
                <strong>Due:</strong> {props.dueDate.toLocaleDateString()} at{" "}
                {props.dueDate.toLocaleTimeString()}
              </Text>
            )}

            {props.requiresPhotoVerification && (
              <Text style={{ ...textStyle, color: "#0070f3" }}>
                📷 <strong>Photo verification required</strong>
              </Text>
            )}
          </Section>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link href={props.choreUrl} style={buttonStyle}>
              View Chore Details
            </Link>
          </Section>

          <Text style={textStyle}>
            Good luck, and thank you for helping keep the family organized!
          </Text>

          <Text style={textStyle}>
            Best regards,
            <br />
            The {props.appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Chore Reminder Email Template
interface ChoreReminderEmailProps {
  choreTitle: string;
  choreDescription: string;
  assignedToName: string;
  familyName: string;
  dueDate: Date;
  daysUntilDue: number;
  priority: "low" | "medium" | "high";
  points: number;
  choreUrl: string;
  appName: string;
}

export const ChoreReminderEmail = (props: ChoreReminderEmailProps) => {
  const urgencyLevel =
    props.daysUntilDue === 0
      ? "urgent"
      : props.daysUntilDue === 1
        ? "soon"
        : "upcoming";
  const urgencyEmoji = {
    urgent: "🚨",
    soon: "⚠️",
    upcoming: "⏰",
  };

  return (
    <Html>
      <Head />
      <Preview>
        Reminder: {props.choreTitle}{" "}
        {props.daysUntilDue === 0
          ? "is due today!"
          : `due in ${props.daysUntilDue} day${props.daysUntilDue === 1 ? "" : "s"}`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            {urgencyEmoji[urgencyLevel]} Chore Reminder
          </Heading>

          <Text style={textStyle}>Hi {props.assignedToName},</Text>

          <Text style={textStyle}>
            This is a friendly reminder about your chore in the{" "}
            {props.familyName} family.
          </Text>

          <Section
            style={{
              backgroundColor:
                urgencyLevel === "urgent" ? "#fff3cd" : "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              border:
                urgencyLevel === "urgent"
                  ? "2px solid #dc3545"
                  : "1px solid #dee2e6",
            }}
          >
            <Text
              style={{
                ...textStyle,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              {props.choreTitle}
            </Text>

            <Text style={textStyle}>{props.choreDescription}</Text>

            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                color: urgencyLevel === "urgent" ? "#dc3545" : "#333",
              }}
            >
              {props.daysUntilDue === 0
                ? "🚨 Due TODAY!"
                : `⏰ Due in ${props.daysUntilDue} day${props.daysUntilDue === 1 ? "" : "s"}`}
            </Text>

            <Text style={textStyle}>
              <strong>Due:</strong> {props.dueDate.toLocaleDateString()} at{" "}
              {props.dueDate.toLocaleTimeString()}
            </Text>

            <Text style={textStyle}>
              <strong>Points:</strong> {props.points} 🌟
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link
              href={props.choreUrl}
              style={{
                ...buttonStyle,
                backgroundColor:
                  urgencyLevel === "urgent" ? "#dc3545" : "#0070f3",
              }}
            >
              {urgencyLevel === "urgent" ? "Complete Now!" : "View Chore"}
            </Link>
          </Section>

          <Text style={textStyle}>
            Don't forget to complete your chore on time to earn your points!
          </Text>

          <Text style={textStyle}>
            Best regards,
            <br />
            The {props.appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Chore Completion Email Template (for parents)
interface ChoreCompletionEmailProps {
  choreTitle: string;
  choreDescription: string;
  completedByName: string;
  familyName: string;
  points: number;
  requiresPhotoVerification: boolean;
  choreUrl: string;
  appName: string;
}

export const ChoreCompletionEmail = (props: ChoreCompletionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {props.completedByName} completed: {props.choreTitle}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>🎉 Chore Completed!</Heading>

          <Text style={textStyle}>
            Great news! {props.completedByName} has completed a chore in the{" "}
            {props.familyName} family.
          </Text>

          <Section
            style={{
              backgroundColor: "#d4edda",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              border: "2px solid #28a745",
            }}
          >
            <Text
              style={{
                ...textStyle,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              ✅ {props.choreTitle}
            </Text>

            <Text style={textStyle}>{props.choreDescription}</Text>

            <Text style={textStyle}>
              <strong>Completed by:</strong> {props.completedByName}
            </Text>

            <Text style={textStyle}>
              <strong>Points earned:</strong> {props.points} 🌟
            </Text>

            {props.requiresPhotoVerification && (
              <Text
                style={{ ...textStyle, color: "#0070f3", fontWeight: "bold" }}
              >
                📷 Photo verification required - Please review and approve
              </Text>
            )}
          </Section>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link href={props.choreUrl} style={buttonStyle}>
              {props.requiresPhotoVerification
                ? "Review Photo"
                : "View Details"}
            </Link>
          </Section>

          <Text style={textStyle}>
            {props.requiresPhotoVerification
              ? "Please review the submitted photo and approve or request a retake."
              : "Congratulations to your family member on completing their chore!"}
          </Text>

          <Text style={textStyle}>
            Best regards,
            <br />
            The {props.appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Photo Approval Email Template
interface PhotoApprovalEmailProps {
  choreTitle: string;
  childName: string;
  familyName: string;
  points: number;
  photoUrl: string;
  choreUrl: string;
  appName: string;
}

export const PhotoApprovalEmail = (props: PhotoApprovalEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Photo approved for {props.choreTitle}!</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>✅ Photo Approved!</Heading>

          <Text style={textStyle}>Congratulations {props.childName}!</Text>

          <Text style={textStyle}>
            Your photo for the chore "{props.choreTitle}" has been approved by a
            parent in the {props.familyName} family.
          </Text>

          <Section
            style={{
              backgroundColor: "#d4edda",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              border: "2px solid #28a745",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                ...textStyle,
                fontSize: "18px",
                fontWeight: "bold",
                color: "#28a745",
              }}
            >
              🎉 Well Done!
            </Text>

            <Text style={textStyle}>
              <strong>Chore:</strong> {props.choreTitle}
            </Text>

            <Text style={textStyle}>
              <strong>Points earned:</strong> {props.points} 🌟
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link href={props.choreUrl} style={buttonStyle}>
              View Chore Details
            </Link>
          </Section>

          <Text style={textStyle}>
            Keep up the great work! Your efforts help keep the family organized
            and running smoothly.
          </Text>

          <Text style={textStyle}>
            Best regards,
            <br />
            The {props.appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Photo Rejection Email Template
interface PhotoRejectionEmailProps {
  choreTitle: string;
  childName: string;
  familyName: string;
  rejectionReason: string;
  photoUrl: string;
  choreUrl: string;
  appName: string;
}

export const PhotoRejectionEmail = (props: PhotoRejectionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Photo needs to be retaken for {props.choreTitle}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>📷 Photo Needs Retaking</Heading>

          <Text style={textStyle}>Hi {props.childName},</Text>

          <Text style={textStyle}>
            The photo you submitted for "{props.choreTitle}" in the{" "}
            {props.familyName} family needs to be retaken.
          </Text>

          <Section
            style={{
              backgroundColor: "#fff3cd",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              border: "2px solid #ffc107",
            }}
          >
            <Text
              style={{
                ...textStyle,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              📝 Feedback from Parent:
            </Text>

            <Text
              style={{
                ...textStyle,
                fontStyle: "italic",
                backgroundColor: "#fff",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              "{props.rejectionReason}"
            </Text>
          </Section>

          <Text style={textStyle}>
            Don't worry! This happens sometimes. Please take a new photo
            following the feedback above and upload it again.
          </Text>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link
              href={props.choreUrl}
              style={{
                ...buttonStyle,
                backgroundColor: "#ffc107",
                color: "#000",
              }}
            >
              Upload New Photo
            </Link>
          </Section>

          <Text style={textStyle}>
            Once you upload a good photo, you'll still earn your points for
            completing the chore!
          </Text>

          <Text style={textStyle}>
            Best regards,
            <br />
            The {props.appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Export render functions
export const renderChoreAssignmentEmail = async (
  props: ChoreAssignmentEmailProps,
): Promise<string> => {
  return await render(<ChoreAssignmentEmail {...props} />);
};

export const renderChoreReminderEmail = async (
  props: ChoreReminderEmailProps,
): Promise<string> => {
  return await render(<ChoreReminderEmail {...props} />);
};

export const renderChoreCompletionEmail = async (
  props: ChoreCompletionEmailProps,
): Promise<string> => {
  return await render(<ChoreCompletionEmail {...props} />);
};

export const renderPhotoApprovalEmail = async (
  props: PhotoApprovalEmailProps,
): Promise<string> => {
  return await render(<PhotoApprovalEmail {...props} />);
};

export const renderPhotoRejectionEmail = async (
  props: PhotoRejectionEmailProps,
): Promise<string> => {
  return await render(<PhotoRejectionEmail {...props} />);
};
