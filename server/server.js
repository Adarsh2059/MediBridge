import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import { startBackgroundJobs } from "./services/backgroundJobs.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Start background worker for medication reminders and email retries
        startBackgroundJobs();

        app.listen(PORT, () => {
            console.log(
                `MediBridge server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();