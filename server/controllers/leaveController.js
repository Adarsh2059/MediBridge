import {
    createDoctorLeave,
    getDoctorLeaves,
    deleteDoctorLeave
} from "../services/leaveService.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createLeave =
    asyncHandler(async (req, res) => {
        const {
            date,
            reason
        } = req.body;

        if (!date) {
            throw new ApiError(
                400,
                "Leave date is required"
            );
        }

        const leave =
            await createDoctorLeave(
                req.params.doctorId,
                {
                    date,
                    reason
                }
            );

        res.status(201).json({
            success: true,
            message:
                "Doctor leave created successfully",
            data: {
                leave
            }
        });
    });

export const getLeaves =
    asyncHandler(async (req, res) => {
        const {
            from,
            to
        } = req.query;

        const leaves =
            await getDoctorLeaves(
                req.params.doctorId,
                {
                    from,
                    to
                }
            );

        res.status(200).json({
            success: true,
            message:
                "Doctor leaves fetched successfully",
            data: {
                leaves
            }
        });
    });

export const deleteLeave =
    asyncHandler(async (req, res) => {
        await deleteDoctorLeave(
            req.params.doctorId,
            req.params.leaveId
        );

        res.status(200).json({
            success: true,
            message:
                "Doctor leave deleted successfully"
        });
    });