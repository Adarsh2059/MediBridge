import express from "express";
import {
    createConsultationHandler,
    getConsultationHandler
} from "../controllers/consultationController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize(ROLES.DOCTOR),
    createConsultationHandler
);

router.get(
    "/appointment/:appointmentId",
    authenticate,
    authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN),
    getConsultationHandler
);

export default router;
