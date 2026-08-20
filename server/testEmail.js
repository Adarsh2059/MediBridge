import "dotenv/config";

import {
    sendEmail
} from "./services/emailService.js";

const testEmail = async () => {
    try {
        const result =
            await sendEmail({
                to:
                    process.env.SMTP_USER,

                subject:
                    "MediBridge SMTP Test",

                text:
                    "MediBridge email service is working correctly.",

                html: `
                    <h2>MediBridge SMTP Test</h2>
                    <p>
                        Email service is working correctly.
                    </p>
                `
            });

        console.log(
            "Email result:",
            result
        );
    } catch (error) {
        console.error(
            "Email test failed:",
            error.message
        );
    }
};

testEmail();