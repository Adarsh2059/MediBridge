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

export const notifyAppointmentConfirmed =
    async ({
        patient,
        doctor,
        appointment
    }) => {
        const patientEmail =
            patient?.email;

        if (!patientEmail) {
            console.warn(
                "Patient email not available. Confirmation notification skipped."
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
            buildAppointmentConfirmedEmail({
                patientName,
                doctorName,
                date:
                    appointment.date,
                startTime:
                    appointment.startTime,
                endTime:
                    appointment.endTime
            });

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
            console.error(
                "Failed to send appointment confirmation notification:",
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