import {
    holdSlot,
    createAppointment,
    getAppointments,
    getAppointmentById,
    cancelAppointment,
    updateAppointmentStatus
} from "../services/appointmentService.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const holdAppointmentSlot =
    asyncHandler(async (req, res) => {
        const {
            doctorId,
            date,
            startTime,
            endTime
        } = req.body;

        if (
            !doctorId ||
            !date ||
            !startTime ||
            !endTime
        ) {
            throw new ApiError(
                400,
                "Doctor, date, start time and end time are required"
            );
        }

        const hold =
            await holdSlot({
                doctorId,
                patientId:
                    req.user.id,
                date,
                startTime,
                endTime
            });

        res.status(201).json({
            success: true,
            message:
                "Appointment slot held successfully",
            data: {
                hold
            }
        });
    });

export const bookAppointment =
    asyncHandler(async (req, res) => {
        const {
            holdId,
            symptoms,
            bookingNotes
        } = req.body;

        if (!holdId) {
            throw new ApiError(
                400,
                "Appointment hold ID is required"
            );
        }

        const appointment =
            await createAppointment({
                patientId:
                    req.user.id,
                holdId,
                symptoms,
                bookingNotes
            });

        res.status(201).json({
            success: true,
            message:
                "Appointment booked successfully",
            data: {
                appointment
            }
        });
    });

export const getAllAppointments =
    asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            status,
            date
        } = req.query;

        const result =
            await getAppointments({
                userId:
                    req.user.id,
                role:
                    req.user.role,
                page,
                limit,
                status,
                date
            });

        res.status(200).json({
            success: true,
            message:
                "Appointments fetched successfully",
            data: result
        });
    });

export const getAppointment =
    asyncHandler(async (req, res) => {
        const appointment =
            await getAppointmentById({
                appointmentId:
                    req.params.id,
                userId:
                    req.user.id,
                role:
                    req.user.role
            });

        res.status(200).json({
            success: true,
            message:
                "Appointment fetched successfully",
            data: {
                appointment
            }
        });
    });

export const cancel =
    asyncHandler(async (req, res) => {
        const {
            reason
        } = req.body;

        const appointment =
            await cancelAppointment({
                appointmentId:
                    req.params.id,
                userId:
                    req.user.id,
                role:
                    req.user.role,
                reason
            });

        res.status(200).json({
            success: true,
            message:
                "Appointment cancelled successfully",
            data: {
                appointment
            }
        });
    });

    export const updateStatus =
    asyncHandler(async (req, res) => {
        const {
            status
        } = req.body;

        if (!status) {
            throw new ApiError(
                400,
                "Appointment status is required"
            );
        }

        const appointment =
            await updateAppointmentStatus({
                appointmentId:
                    req.params.id,

                userId:
                    req.user.id,

                role:
                    req.user.role,

                status
            });

        res.status(200).json({
            success: true,
            message:
                "Appointment status updated successfully",
            data: {
                appointment
            }
        });
    });