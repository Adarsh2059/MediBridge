import MedicationReminder from "../models/MedicationReminder.js";
import EmailQueue from "../models/EmailQueue.js";
import { notifyMedicationReminder } from "./notificationService.js";
import { sendEmailDirect } from "./emailService.js";

let intervalId = null;

export const processMedicationReminders = async () => {
    try {
        const now = new Date();
        const pendingReminders = await MedicationReminder.find({
            status: "pending",
            scheduledTime: { $lte: now }
        }).populate("patient");

        if (pendingReminders.length === 0) return;

        console.log(`[Background Jobs] Processing ${pendingReminders.length} pending medication reminders...`);

        for (const reminder of pendingReminders) {
            try {
                if (!reminder.patient || !reminder.patient.email) {
                    console.warn(`[Background Jobs] Patient email unavailable for reminder ID: ${reminder._id}`);
                    reminder.status = "failed";
                    reminder.errorMessage = "Patient email unavailable";
                    await reminder.save();
                    continue;
                }

                const result = await notifyMedicationReminder({
                    patient: reminder.patient,
                    medicineName: reminder.medicineName,
                    dosage: reminder.dosage,
                    instructions: reminder.instructions
                });

                if (result.sent) {
                    reminder.status = "sent";
                    reminder.sentAt = new Date();
                    reminder.errorMessage = null;
                } else {
                    reminder.retryCount += 1;
                    reminder.errorMessage = result.error || "Failed to send email";
                    if (reminder.retryCount >= 3) {
                        reminder.status = "failed";
                    }
                }
                await reminder.save();
            } catch (err) {
                console.error(`[Background Jobs] Error processing reminder ID: ${reminder._id}:`, err.message);
                reminder.retryCount += 1;
                reminder.errorMessage = err.message;
                if (reminder.retryCount >= 3) {
                    reminder.status = "failed";
                }
                await reminder.save();
            }
        }
    } catch (error) {
        console.error("[Background Jobs] Error in processMedicationReminders:", error.message);
    }
};

export const processEmailRetries = async () => {
    try {
        const now = new Date();
        const queuedEmails = await EmailQueue.find({
            status: "failed",
            retryCount: { $lt: 3 },
            nextAttemptAt: { $lte: now }
        });

        if (queuedEmails.length === 0) return;

        console.log(`[Background Jobs] Retrying ${queuedEmails.length} failed emails...`);

        for (const email of queuedEmails) {
            try {
                const result = await sendEmailDirect({
                    to: email.to,
                    subject: email.subject,
                    text: email.text,
                    html: email.html
                });

                if (result.sent) {
                    email.status = "sent";
                    email.retryCount += 1;
                    email.lastError = null;
                } else {
                    email.retryCount += 1;
                    email.lastError = result.error || "SMTP send failed";
                    if (email.retryCount >= 3) {
                        email.status = "failed";
                    } else {
                        // Exponential backoff: retry in 2, 4, or 6 minutes
                        const backoffMinutes = email.retryCount * 2;
                        email.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
                    }
                }
                await email.save();
            } catch (err) {
                console.error(`[Background Jobs] Error retrying email ID: ${email._id}:`, err.message);
                email.retryCount += 1;
                email.lastError = err.message;
                if (email.retryCount >= 3) {
                    email.status = "failed";
                } else {
                    const backoffMinutes = email.retryCount * 2;
                    email.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
                }
                await email.save();
            }
        }
    } catch (error) {
        console.error("[Background Jobs] Error in processEmailRetries:", error.message);
    }
};

export const startBackgroundJobs = () => {
    if (intervalId) {
        console.warn("[Background Jobs] Worker is already running.");
        return;
    }

    console.log("[Background Jobs] Starting background jobs worker (interval: 30 seconds)...");
    
    intervalId = setInterval(async () => {
        await processMedicationReminders();
        await processEmailRetries();
    }, 30000);
};

export const stopBackgroundJobs = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("[Background Jobs] Background jobs worker stopped.");
    }
};
