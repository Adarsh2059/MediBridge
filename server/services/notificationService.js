import {
    sendEmail
} from "./emailService.js";

const buildAppointmentCancelledEmail =
    ({
        patientName,
        doctorName,
        date,
        startTime,
        endTime,
        reason
    }) => {
        const subject =
            "MediBridge - Appointment Cancelled";

        const text = `
Hello ${patientName || "Patient"},

Your MediBridge appointment has been cancelled.

Doctor: ${doctorName}
Date: ${date}
Time: ${startTime} - ${endTime}

Reason:
${reason}

Please book another available appointment through MediBridge.

Regards,
MediBridge Team
        `.trim();

        const html = `
            <div>
                <h2>MediBridge - Appointment Cancelled</h2>

                <p>
                    Hello
                    <strong>
                        ${patientName || "Patient"}
                    </strong>,
                </p>

                <p>
                    Your MediBridge appointment has been cancelled.
                </p>

                <p>
                    <strong>Doctor:</strong>
                    ${doctorName}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${date}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${startTime} - ${endTime}
                </p>

                <p>
                    <strong>Reason:</strong>
                    ${reason}
                </p>

                <p>
                    Please book another available
                    appointment through MediBridge.
                </p>

                <p>
                    Regards,<br />
                    MediBridge Team
                </p>
            </div>
        `;

        return {
            subject,
            text,
            html
        };
    };

export const notifyAppointmentCancelled =
    async ({
        patient,
        doctor,
        appointment,
        reason
    }) => {
        const patientEmail =
            patient?.email;

        if (!patientEmail) {
            console.warn(
                "Patient email not available. Cancellation notification skipped."
            );

            return {
                sent: false,
                skipped: true
            };
        }

        const doctorName =
            doctor?.user?.name ||
            doctor?.name ||
            "Doctor";

        const patientName =
            patient?.name ||
            "Patient";

        const email =
            buildAppointmentCancelledEmail(
                {
                    patientName,

                    doctorName,

                    date:
                        appointment.date,

                    startTime:
                        appointment.startTime,

                    endTime:
                        appointment.endTime,

                    reason
                }
            );

        try {
            return await sendEmail({
                to: patientEmail,

                subject:
                    email.subject,

                text:
                    email.text,

                html:
                    email.html
            });
        } catch (error) {
            /*
             * Notification failure must not
             * break the appointment workflow.
             */
            console.error(
                "Failed to send appointment cancellation notification:",
                error.message
            );

            return {
                sent: false,
                skipped: false,
                error:
                    error.message
            };
        }
    };

const buildAppointmentConfirmedEmail = ({
    patientName,
    doctorName,
    date,
    startTime,
    endTime
}) => {
    const subject =
        "MediBridge - Appointment Confirmed";

    const text = `
Hello ${patientName || "Patient"},

Your MediBridge appointment has been confirmed.

Doctor: ${doctorName}
Date: ${date}
Time: ${startTime} - ${endTime}

Please arrive on time for your appointment.

Regards,
MediBridge Team
    `.trim();

    const html = `
        <div>
            <h2>MediBridge - Appointment Confirmed</h2>

            <p>
                Hello
                <strong>
                    ${patientName || "Patient"}
                </strong>,
            </p>

            <p>
                Your MediBridge appointment has been
                <strong>confirmed</strong>.
            </p>

            <p>
                <strong>Doctor:</strong>
                ${doctorName}
            </p>

            <p>
                <strong>Date:</strong>
                ${date}
            </p>

            <p>
                <strong>Time:</strong>
                ${startTime} - ${endTime}
            </p>

            <p>
                Please arrive on time for your appointment.
            </p>

            <p>
                Regards,<br />
                MediBridge Team
            </p>
        </div>
    `;

    return {
        subject,
        text,
        html
    };
};

export const notifyAppointmentConfirmed = async ({ patient, doctor, appointment }) => {
    const patientEmail = patient?.email;
    const doctorEmail = doctor?.user?.email || doctor?.email;
    const doctorName = doctor?.user?.name || doctor?.name || "Doctor";
    const patientName = patient?.name || "Patient";

    const emailTemplate = buildAppointmentConfirmedEmail({
        patientName,
        doctorName,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime
    });

    // Send to Patient
    if (patientEmail) {
        try {
            await sendEmail({
                to: patientEmail,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html
            });
        } catch (error) {
            console.error("Failed to send confirmation email to patient:", error.message);
        }
    }

    // Send to Doctor
    if (doctorEmail) {
        try {
            await sendEmail({
                to: doctorEmail,
                subject: `MediBridge - New Appointment Confirmed with ${patientName}`,
                text: `Hello Dr. ${doctorName},\n\nYou have a new confirmed appointment with ${patientName}.\n\nDate: ${appointment.date}\nTime: ${appointment.startTime} - ${appointment.endTime}\nSymptoms: ${appointment.symptoms}\n\nRegards,\nMediBridge Team`,
                html: `<div><h3>New Appointment Confirmed</h3><p>Hello Dr. ${doctorName},</p><p>You have a new confirmed appointment with <strong>${patientName}</strong>.</p><p><strong>Date:</strong> ${appointment.date}<br/><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}<br/><strong>Symptoms:</strong> ${appointment.symptoms}</p><p>Regards,<br/>MediBridge Team</p></div>`
            });
        } catch (error) {
            console.error("Failed to send confirmation email to doctor:", error.message);
        }
    }

    return { sent: true };
};

// Reschedule Email Templates & Notifications
export const notifyAppointmentRescheduled = async ({ patient, doctor, oldAppointment, newAppointment }) => {
    const patientEmail = patient?.email;
    const doctorEmail = doctor?.user?.email || doctor?.email;
    const doctorName = doctor?.user?.name || doctor?.name || "Doctor";
    const patientName = patient?.name || "Patient";

    const subject = "MediBridge - Appointment Rescheduled";
    const text = `Hello,\n\nYour appointment has been rescheduled.\n\nDoctor: Dr. ${doctorName}\nPatient: ${patientName}\n\nPrevious Time: ${oldAppointment.date} @ ${oldAppointment.startTime} - ${oldAppointment.endTime}\nNew Time: ${newAppointment.date} @ ${newAppointment.startTime} - ${newAppointment.endTime}\n\nRegards,\nMediBridge Team`;
    const html = `<div><h2>MediBridge - Appointment Rescheduled</h2><p>Hello,</p><p>Your appointment has been <strong>rescheduled</strong>.</p><p><strong>Doctor:</strong> Dr. ${doctorName}<br/><strong>Patient:</strong> ${patientName}</p><p><strong>Original Time:</strong> ${oldAppointment.date} at ${oldAppointment.startTime} - ${oldAppointment.endTime}<br/><strong>New Time:</strong> ${newAppointment.date} at ${newAppointment.startTime} - ${newAppointment.endTime}</p><p>Regards,<br/>MediBridge Team</p></div>`;

    if (patientEmail) {
        try {
            await sendEmail({ to: patientEmail, subject, text, html });
        } catch (error) {
            console.error("Failed to send reschedule email to patient:", error.message);
        }
    }

    if (doctorEmail) {
        try {
            await sendEmail({ to: doctorEmail, subject, text, html });
        } catch (error) {
            console.error("Failed to send reschedule email to doctor:", error.message);
        }
    }

    return { sent: true };
};

// General Upcoming Visit Reminders
export const notifyAppointmentReminder = async ({ patient, doctor, appointment }) => {
    const patientEmail = patient?.email;
    const doctorEmail = doctor?.user?.email || doctor?.email;
    const doctorName = doctor?.user?.name || doctor?.name || "Doctor";
    const patientName = patient?.name || "Patient";

    const subject = "MediBridge - Upcoming Appointment Reminder";
    const text = `Hello,\n\nThis is a reminder for your upcoming appointment.\n\nDate: ${appointment.date}\nTime: ${appointment.startTime} - ${appointment.endTime}\nDoctor: Dr. ${doctorName}\nPatient: ${patientName}\n\nRegards,\nMediBridge Team`;
    const html = `<div><h2>MediBridge - Appointment Reminder</h2><p>Hello,</p><p>This is a reminder for your upcoming appointment.</p><p><strong>Doctor:</strong> Dr. ${doctorName}<br/><strong>Patient:</strong> ${patientName}</p><p><strong>Time:</strong> ${appointment.date} at ${appointment.startTime} - ${appointment.endTime}</p><p>Please join on time.</p><p>Regards,<br/>MediBridge Team</p></div>`;

    if (patientEmail) {
        try {
            await sendEmail({ to: patientEmail, subject, text, html });
        } catch (error) {
            console.error("Failed to send reminder email to patient:", error.message);
        }
    }

    if (doctorEmail) {
        try {
            await sendEmail({ to: doctorEmail, subject, text, html });
        } catch (error) {
            console.error("Failed to send reminder email to doctor:", error.message);
        }
    }

    return { sent: true };
};

// Medication Reminder Emails
export const notifyMedicationReminder = async ({ patient, medicineName, dosage, instructions }) => {
    const patientEmail = patient?.email;
    const patientName = patient?.name || "Patient";

    if (!patientEmail) return { sent: false };

    const subject = `MediBridge - Medication Reminder: ${medicineName}`;
    const text = `Hello ${patientName},\n\nThis is a reminder to take your medicine:\n\nMedicine: ${medicineName}\nDosage: ${dosage}\nInstructions: ${instructions || "As directed by doctor"}\n\nRegards,\nMediBridge Team`;
    const html = `<div><h2>Medication Reminder</h2><p>Hello ${patientName},</p><p>It is time to take your prescribed medicine.</p><div style="background-color:#f3f4f6;padding:1rem;border-radius:8px;margin:1rem 0;"><strong>Medicine:</strong> ${medicineName}<br/><strong>Dosage:</strong> ${dosage}<br/><strong>Instructions:</strong> ${instructions || "As directed by doctor"}</div><p>Regards,<br/>MediBridge Team</p></div>`;

    try {
        await sendEmail({ to: patientEmail, subject, text, html });
        return { sent: true };
    } catch (error) {
        console.error("Failed to send medication reminder email:", error.message);
        return { sent: false, error: error.message };
    }
};