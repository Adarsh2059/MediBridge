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

import EmailQueue from "../models/EmailQueue.js";

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

    try {
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
    } catch (error) {
        console.error("sendEmail failed. Queuing for background retry:", error.message);
        try {
            await EmailQueue.create({
                to,
                subject,
                text: text || "",
                html: html || "",
                status: "failed",
                retryCount: 0,
                lastError: error.message,
                nextAttemptAt: new Date(Date.now() + 60 * 1000) // retry in 1 minute
            });
        } catch (queueError) {
            console.error("Failed to queue email to database:", queueError.message);
        }

        return {
            sent: false,
            error: error.message,
            queued: true
        };
    }
};


export const verifyEmailConnection =
    async () => {
        if (!transporter) {
            return false;
        }

        await transporter.verify();

        return true;
    };

export const sendEmailDirect = async ({
    to,
    subject,
    text,
    html
}) => {
    if (!transporter) {
        return {
            sent: false,
            skipped: true
        };
    }
    const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    });
    return {
        sent: true,
        messageId: result.messageId
    };
};