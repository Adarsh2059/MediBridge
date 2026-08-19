import {
    createPreVisitAssessment,
    getPreVisitAssessment
} from "../services/preVisitService.js";

import asyncHandler from "../utils/asyncHandler.js";

export const createAssessment =
    asyncHandler(async (req, res) => {
        const {
            appointmentId,
            symptoms
        } = req.body;

        const assessment =
            await createPreVisitAssessment(
                {
                    appointmentId,
                    patientId:
                        req.user.id,
                    symptoms
                }
            );

        res.status(201).json({
            success: true,
            message:
                "Pre-visit assessment generated successfully",
            data: {
                assessment
            }
        });
    });

export const getAssessment =
    asyncHandler(async (req, res) => {
        const assessment =
            await getPreVisitAssessment(
                {
                    appointmentId:
                        req.params.appointmentId,

                    userId:
                        req.user.id,

                    role:
                        req.user.role
                }
            );

        res.status(200).json({
            success: true,
            message:
                "Pre-visit assessment fetched successfully",
            data: {
                assessment
            }
        });
    });