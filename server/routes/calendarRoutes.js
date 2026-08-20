import express from "express";

import {
    connectGoogleCalendar,
    googleCalendarCallback,
    getCalendarStatus
} from "../controllers/calendarController.js";

import authenticate from "../middlewares/authMiddleware.js";

const router =
    express.Router();

router.get(
    "/connect",
    authenticate,
    connectGoogleCalendar
);

router.get(
    "/oauth/callback",
    googleCalendarCallback
);

router.get(
    "/status",
    authenticate,
    getCalendarStatus
);

export default router;