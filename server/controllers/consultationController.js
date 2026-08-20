import {
    createConsultation,
    getConsultationByAppointment
} from "../services/consultationService.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createConsultationHandler = asyncHandler(async (req, res) => {
    const {
        appointmentId,
        clinicalNotes,
        diagnosis,
        prescription,
        followUpInstructions
    } = req.body;

    if (!appointmentId) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const consultation = await createConsultation({
        appointmentId,
        doctorUserId: req.user.id,
        clinicalNotes,
        diagnosis,
        prescription,
        followUpInstructions
    });

    res.status(201).json({
        success: true,
        message: "Consultation submitted successfully and appointment completed.",
        data: {
            consultation
        }
    });
});

export const getConsultationHandler = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    if (!appointmentId) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const consultation = await getConsultationByAppointment({
        appointmentId,
        userId: req.user.id,
        role: req.user.role
    });

    res.status(200).json({
        success: true,
        message: "Consultation fetched successfully.",
        data: {
            consultation
        }
    });
});
