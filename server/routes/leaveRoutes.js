import express from "express";

import {
    createLeave,
    getLeaves,
    deleteLeave
} from "../controllers/leaveController.js";

import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post(
    "/:doctorId/leaves",
    authenticate,
    authorize(ROLES.ADMIN),
    createLeave
);

router.get(
    "/:doctorId/leaves",
    authenticate,
    authorize(
        ROLES.ADMIN,
        ROLES.DOCTOR,
        ROLES.PATIENT
    ),
    getLeaves
);

router.delete(
    "/:doctorId/leaves/:leaveId",
    authenticate,
    authorize(ROLES.ADMIN),
    deleteLeave
);

export default router;