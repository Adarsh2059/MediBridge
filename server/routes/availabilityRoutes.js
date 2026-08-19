import express from "express";

import {
    getAvailability
} from "../controllers/availabilityController.js";

import authenticate from "../middlewares/authMiddleware.js";

import { ROLES } from "../constants/roles.js";
import authorize from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
    "/:doctorId/availability",
    authenticate,
    authorize(
        ROLES.ADMIN,
        ROLES.DOCTOR,
        ROLES.PATIENT
    ),
    getAvailability
);

export default router;