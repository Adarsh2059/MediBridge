import DoctorProfile from "../models/DoctorProfile.js";
import DoctorLeave from "../models/DoctorLeave.js";
import Appointment from "../models/Appointment.js";

import ApiError from "../utils/ApiError.js";

import {
    isValidDateString
} from "../utils/dateUtils.js";

import {
    APPOINTMENT_STATUS,
    ACTIVE_APPOINTMENT_STATUSES
} from "../constants/appointmentStatus.js";

import {
    notifyAppointmentCancelled
} from "./notificationService.js";

const ensureDoctorExists = async (
    doctorId
) => {
    const doctor =
        await DoctorProfile.findById(
            doctorId
        ).populate({
            path: "user",
            select: "name email"
        });

    if (!doctor) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    return doctor;
};

export const createDoctorLeave = async (
    doctorId,
    { date, reason = "" }
) => {
    if (!isValidDateString(date)) {
        throw new ApiError(
            400,
            "Invalid date. Expected YYYY-MM-DD"
        );
    }

    const doctor =
        await ensureDoctorExists(
            doctorId
        );

    const existingLeave =
        await DoctorLeave.findOne({
            doctor: doctorId,
            date
        });

    if (existingLeave) {
        throw new ApiError(
            409,
            "Doctor already has leave on this date"
        );
    }

    /*
     * Create the leave first.
     *
     * This guarantees that the availability
     * service immediately recognizes the doctor
     * as unavailable on this date.
     */
    const leave =
        await DoctorLeave.create({
            doctor: doctorId,
            date,
            reason:
                reason.trim()
        });

    /*
     * Find all active appointments for the
     * doctor on the leave date.
     */
    const affectedAppointments =
        await Appointment.find({
            doctor: doctorId,
            date,
            status: {
                $in:
                    ACTIVE_APPOINTMENT_STATUSES
            }
        })
            .populate({
                path: "patient",
                select:
                    "name email phone"
            });

    const cancellationReason =
        reason.trim() ||
        "Doctor is unavailable on this date.";

    /*
     * Cancel affected appointments.
     *
     * Notification failure must NOT prevent
     * other appointments from being cancelled.
     */
    const cancelledAppointments = [];

    for (
        const appointment
        of affectedAppointments
    ) {
        appointment.status =
            APPOINTMENT_STATUS.CANCELLED;

        appointment.cancellationReason =
            cancellationReason;

        await appointment.save();

        cancelledAppointments.push(
            appointment
        );

        /*
         * Send notification independently.
         *
         * notifyAppointmentCancelled()
         * already handles email failures
         * without throwing them further.
         */
        await notifyAppointmentCancelled({
            patient:
                appointment.patient,

            doctor,

            appointment,

            reason:
                cancellationReason
        });
    }

    return {
        leave,

        affectedAppointments:
            cancelledAppointments,

        affectedCount:
            cancelledAppointments.length
    };
};

export const getDoctorLeaves = async (
    doctorId,
    { from, to } = {}
) => {
    await ensureDoctorExists(
        doctorId
    );

    const filter = {
        doctor: doctorId
    };

    if (from || to) {
        filter.date = {};

        if (from) {
            if (!isValidDateString(from)) {
                throw new ApiError(
                    400,
                    "Invalid 'from' date"
                );
            }

            filter.date.$gte = from;
        }

        if (to) {
            if (!isValidDateString(to)) {
                throw new ApiError(
                    400,
                    "Invalid 'to' date"
                );
            }

            filter.date.$lte = to;
        }
    }

    return DoctorLeave.find(filter)
        .sort({
            date: 1
        })
        .lean();
};

export const deleteDoctorLeave = async (
    doctorId,
    leaveId
) => {
    await ensureDoctorExists(
        doctorId
    );

    const leave =
        await DoctorLeave.findOne({
            _id: leaveId,
            doctor: doctorId
        });

    if (!leave) {
        throw new ApiError(
            404,
            "Leave record not found"
        );
    }

    await DoctorLeave.findByIdAndDelete(
        leaveId
    );

    return leave;
};