import express from "express";

import {
    createDoctorController,
    getDoctors,
    getDoctor,
    updateDoctorController,
    updateDoctorStatusController,
    deleteDoctorController
} from "../controllers/doctorController.js";

import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { ROLES } from "../constants/roles.js";

const router = express.Router();

/*
 * Admin-only doctor management
 */

router.post(
    "/",
    authenticate,
    authorize(ROLES.ADMIN),
    createDoctorController
);

router.get(
    "/",
    authenticate,
    authorize(
        ROLES.ADMIN,
        ROLES.PATIENT,
        ROLES.DOCTOR
    ),
    getDoctors
);

router.get(
    "/:id",
    authenticate,
    authorize(
        ROLES.ADMIN,
        ROLES.PATIENT,
        ROLES.DOCTOR
    ),
    getDoctor
);

router.patch(
    "/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    updateDoctorController
);

router.patch(
    "/:id/status",
    authenticate,
    authorize(ROLES.ADMIN),
    updateDoctorStatusController
);

router.delete(
    "/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    deleteDoctorController
);

export default router;