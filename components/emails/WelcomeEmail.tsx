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

interface WelcomeEmailProps {
  name: string;
  appName: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  name,
  appName,
  dashboardUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Img
            src="https://yourdomain.com/logo.png"
            alt={`${appName} Logo`}
            width="120"
            height="50"
          />
          <Heading style={headingStyle}>Welcome to {appName}!</Heading>
          <Text style={textStyle}>Hi {name},</Text>
          <Text style={textStyle}>
            We're thrilled to have you join us. Your account has been
            successfully created and you're ready to get started.
          </Text>
          <Section style={buttonContainerStyle}>
            <Link style={buttonStyle} href={dashboardUrl}>
              Go to Dashboard
            </Link>
          </Section>
          <Text style={textStyle}>
            If you have any questions, simply reply to this email. We're always
            here to help.
          </Text>
          <Text style={textStyle}>
            Best regards,
            <br />
            The {appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Export a function to render the email to HTML asynchronously
export async function renderWelcomeEmail(
  props: WelcomeEmailProps,
): Promise<string> {
  return await render(<WelcomeEmail {...props} />);
}

// Styles
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

const buttonContainerStyle = {
  margin: "20px 0",
  textAlign: "center" as const,
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
