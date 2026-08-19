import {
    getDoctorAvailability
} from "../services/availabilityService.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAvailability =
    asyncHandler(async (req, res) => {
        const { date } =
            req.query;

        if (!date) {
            throw new ApiError(
                400,
                "Date query parameter is required"
            );
        }

        const availability =
            await getDoctorAvailability(
                req.params.doctorId,
                date
            );

        res.status(200).json({
            success: true,
            message:
                "Doctor availability fetched successfully",
            data: {
                availability
            }
        });
    });