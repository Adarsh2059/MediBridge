import express from "express";

import {
    createAssessment,
    getAssessment
} from "../controllers/preVisitController.js";

import authenticate from "../middlewares/authMiddleware.js";

import authorize from "../middlewares/roleMiddleware.js";

import {
    ROLES
} from "../constants/roles.js";

const router =
    express.Router();

router.post(
    "/",
    authenticate,
    authorize(ROLES.PATIENT),
    createAssessment
);

router.get(
    "/:appointmentId",
    authenticate,
    authorize(
        ROLES.PATIENT,
        ROLES.DOCTOR,
        ROLES.ADMIN
    ),
    getAssessment
);

export default router;