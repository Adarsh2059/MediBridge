import nodemailer from "nodemailer";

const isEmailConfigured =
    Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
    );

const transporter =
    isEmailConfigured
        ? nodemailer.createTransport({
              host:
                  process.env.SMTP_HOST,

              port:
                  Number(
                      process.env.SMTP_PORT
                  ),

              secure:
                  process.env.SMTP_SECURE ===
                  "true",

              auth: {
                  user:
                      process.env.SMTP_USER,

                  pass:
                      process.env.SMTP_PASSWORD
              }
          })
        : null;

export const sendEmail = async ({
    to,
    subject,
    text,
    html
}) => {
    if (!transporter) {
        console.warn(
            "Email service is not configured. Email was skipped."
        );

        return {
            sent: false,
            skipped: true
        };
    }

    if (!to) {
        throw new Error(
            "Recipient email is required"
        );
    }

    const result =
        await transporter.sendMail({
            from:
                process.env.EMAIL_FROM ||
                process.env.SMTP_USER,

            to,

            subject,

            text,

            html
        });

    return {
        sent: true,
        messageId:
            result.messageId
    };
};

export const verifyEmailConnection =
    async () => {
        if (!transporter) {
            return false;
        }

        await transporter.verify();

        return true;
    };