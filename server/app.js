import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MediBridge API is running",
        environment: process.env.NODE_ENV || "development"
    });
});

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/doctors",
    doctorRoutes
);

app.use(
    "/api/doctors",
    leaveRoutes
);

app.use(
    "/api/doctors",
    availabilityRoutes
);

app.use(
    "/api/appointments",
    appointmentRoutes
);

app.use(
    errorHandler
);

export default app;