import express from "express";

import {
    holdAppointmentSlot,
    bookAppointment,
    getAllAppointments,
    getAppointment,
    cancel,
    updateStatus,
    reschedule
} from "../controllers/appointmentController.js";


import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post(
    "/hold",
    authenticate,
    authorize(ROLES.PATIENT),
    holdAppointmentSlot
);

router.post(
    "/",
    authenticate,
    authorize(ROLES.PATIENT),
    bookAppointment
);

router.get(
    "/",
    authenticate,
    authorize(
        ROLES.PATIENT,
        ROLES.DOCTOR,
        ROLES.ADMIN
    ),
    getAllAppointments
);

router.patch(
    "/:id/status",
    authenticate,
    authorize(ROLES.DOCTOR),
    updateStatus
);

router.get(
    "/:id",
    authenticate,
    authorize(
        ROLES.PATIENT,
        ROLES.DOCTOR,
        ROLES.ADMIN
    ),
    getAppointment
);

router.patch(
    "/:id/cancel",
    authenticate,
    authorize(
        ROLES.PATIENT,
        ROLES.DOCTOR,
        ROLES.ADMIN
    ),
    cancel
);

router.patch(
    "/:id/reschedule",
    authenticate,
    authorize(
        ROLES.PATIENT,
        ROLES.DOCTOR,
        ROLES.ADMIN
    ),
    reschedule
);

export default router;