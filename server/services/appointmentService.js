import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import AppointmentHold from "../models/AppointmentHold.js";
import DoctorProfile from "../models/DoctorProfile.js";
import DoctorLeave from "../models/DoctorLeave.js";
import User from "../models/User.js";


import ApiError from "../utils/ApiError.js";

import {
    getDoctorAvailability
} from "./availabilityService.js";

import {
    APPOINTMENT_STATUS,
    ACTIVE_APPOINTMENT_STATUSES
} from "../constants/appointmentStatus.js";

import {
    isValidDateString,
    timeToMinutes
} from "../utils/dateUtils.js";

const HOLD_DURATION_MINUTES = 5;

const populateAppointment = (query) => {
    return query
        .populate({
            path: "doctor",
            populate: {
                path: "user",
                select: "name email phone"
            }
        })
        .populate({
            path: "patient",
            select: "name email phone"
        })
        .populate({
            path: "rescheduledFrom",
            select: "date startTime endTime status"
        })
        .populate({
            path: "rescheduledTo",
            select: "date startTime endTime status"
        });
};

const ensureDoctorExists = async (
    doctorId
) => {
    const doctor =
        await DoctorProfile.findById(
            doctorId
        ).populate({
            path: "user",
            select: "name email isActive role"
        });

    if (
        !doctor ||
        !doctor.user ||
        doctor.user.role !== "doctor"
    ) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    if (!doctor.user.isActive) {
        throw new ApiError(
            403,
            "Doctor is currently inactive"
        );
    }

    return doctor;
};

const validateSlot = async ({
    doctorId,
    date,
    startTime,
    endTime
}) => {
    const availability =
        await getDoctorAvailability(
            doctorId,
            date
        );

    if (availability.isOnLeave) {
        throw new ApiError(
            409,
            "Doctor is on leave on the selected date"
        );
    }

    const matchingSlot =
        availability.slots.find(
            (slot) =>
                slot.start === startTime &&
                slot.end === endTime
        );

    if (!matchingSlot) {
        throw new ApiError(
            409,
            "Selected slot is not part of the doctor's availability"
        );
    }

    /*
     * The slot must be completely available.
     *
     * "held" means another patient currently
     * has a temporary reservation.
     *
     * "booked" means the appointment already exists.
     */
    if (
        matchingSlot.status !== "available"
    ) {
        if (
            matchingSlot.status === "held"
        ) {
            throw new ApiError(
                409,
                "This slot is currently being held by another patient"
            );
        }

        if (
            matchingSlot.status === "booked"
        ) {
            throw new ApiError(
                409,
                "This slot has already been booked"
            );
        }

        throw new ApiError(
            409,
            "Selected slot is not available"
        );
    }
};

export const holdSlot = async ({
    doctorId,
    patientId,
    date,
    startTime,
    endTime
}) => {
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

    const patient =
        await User.findById(
            patientId
        );

    if (!patient) {
        throw new ApiError(
            404,
            "Patient not found"
        );
    }

    await validateSlot({
        doctorId,
        date,
        startTime,
        endTime
    });

    const existingAppointment =
        await Appointment.findOne({
            doctor: doctorId,
            date,
            startTime,
            status: {
                $in:
                    ACTIVE_APPOINTMENT_STATUSES
            }
        });

    if (existingAppointment) {
        throw new ApiError(
            409,
            "This slot has already been booked"
        );
    }

    /*
     * Clean expired holds belonging to this slot.
     *
     * MongoDB TTL deletion is asynchronous, so we
     * don't rely solely on TTL for immediate availability.
     */
    await AppointmentHold.deleteMany({
        doctor: doctorId,
        date,
        startTime,
        expiresAt: {
            $lte: new Date()
        }
    });

    const expiresAt =
        new Date(
            Date.now() +
                HOLD_DURATION_MINUTES *
                    60 *
                    1000
        );

    try {
        const hold =
            await AppointmentHold.create({
                doctor: doctorId,
                patient: patientId,
                date,
                startTime,
                endTime,
                expiresAt
            });

        return {
            holdId: hold._id,
            doctorId,
            date,
            startTime,
            endTime,
            expiresAt
        };
    } catch (error) {
        if (
            error.code === 11000
        ) {
            throw new ApiError(
                409,
                "This slot is currently being held by another patient"
            );
        }

        throw error;
    }
};

export const createAppointment = async ({
    patientId,
    holdId,
    symptoms,
    bookingNotes = ""
}) => {
    if (!symptoms?.trim()) {
        throw new ApiError(
            400,
            "Symptoms are required before confirming an appointment"
        );
    }

    const hold =
        await AppointmentHold.findOne({
            _id: holdId,
            patient: patientId,
            expiresAt: {
                $gt: new Date()
            }
        });

    if (!hold) {
        throw new ApiError(
            409,
            "Appointment hold has expired or is no longer valid"
        );
    }

    const doctor =
        await ensureDoctorExists(
            hold.doctor
        );

    /*
     * Revalidate the slot before final booking.
     *
     * This protects against changes that happened
     * after the hold was created.
     */
    await validateSlot({
        doctorId: hold.doctor,
        date: hold.date,
        startTime: hold.startTime,
        endTime: hold.endTime
    });

    const session =
        await mongoose.startSession();

    try {
        session.startTransaction();

        const conflictingAppointment =
            await Appointment.findOne(
                {
                    doctor: hold.doctor,
                    date: hold.date,
                    startTime: hold.startTime,
                    status: {
                        $in:
                            ACTIVE_APPOINTMENT_STATUSES
                    }
                }
            ).session(session);

        if (conflictingAppointment) {
            throw new ApiError(
                409,
                "This slot has already been booked"
            );
        }

        const [appointment] =
            await Appointment.create(
                [
                    {
                        doctor:
                            hold.doctor,
                        patient:
                            hold.patient,
                        date:
                            hold.date,
                        startTime:
                            hold.startTime,
                        endTime:
                            hold.endTime,
                        status:
                            APPOINTMENT_STATUS.BOOKED,
                        symptoms:
                            symptoms.trim(),
                        bookingNotes:
                            bookingNotes.trim()
                    }
                ],
                {
                    session
                }
            );

        await AppointmentHold.deleteOne({
            _id: hold._id
        }).session(session);

        await session.commitTransaction();

        const populatedAppointment =
            await populateAppointment(
                Appointment.findById(
                    appointment._id
                )
            );

        return populatedAppointment;
    } catch (error) {
        await session.abortTransaction();

        if (
            error.code === 11000
        ) {
            throw new ApiError(
                409,
                "This slot has already been booked"
            );
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

export const getAppointmentById = async ({
    appointmentId,
    userId,
    role
}) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            appointmentId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid appointment ID"
        );
    }

    const appointment =
        await populateAppointment(
            Appointment.findById(
                appointmentId
            )
        );

    if (!appointment) {
        throw new ApiError(
            404,
            "Appointment not found"
        );
    }

    const isAdmin =
        role === "admin";

    const isPatient =
        appointment.patient?._id.toString() ===
        userId;

    const isDoctor =
        appointment.doctor?.user?._id.toString() ===
        userId;

    if (
        !isAdmin &&
        !isPatient &&
        !isDoctor
    ) {
        throw new ApiError(
            403,
            "You do not have permission to access this appointment"
        );
    }

    return appointment;
};

export const getAppointments = async ({
    userId,
    role,
    page = 1,
    limit = 10,
    status,
    date
}) => {
    const currentPage = Math.max(
        Number(page) || 1,
        1
    );

    const pageLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const filter = {};

    if (role === "patient") {
        filter.patient = userId;
    } else if (role === "doctor") {
        const doctor =
            await DoctorProfile.findOne({
                user: userId
            });

        if (!doctor) {
            throw new ApiError(
                404,
                "Doctor profile not found"
            );
        }

        filter.doctor =
            doctor._id;
    }

    if (status) {
        filter.status = status;
    }

    if (date) {
        if (!isValidDateString(date)) {
            throw new ApiError(
                400,
                "Invalid date. Expected YYYY-MM-DD"
            );
        }

        filter.date = date;
    }

    const skip =
        (currentPage - 1) *
        pageLimit;

    const [
        appointments,
        total
    ] = await Promise.all([
        populateAppointment(
            Appointment.find(filter)
                .sort({
                    date: -1,
                    startTime: -1
                })
                .skip(skip)
                .limit(pageLimit)
        ),
        Appointment.countDocuments(
            filter
        )
    ]);

    return {
        appointments,
        pagination: {
            page: currentPage,
            limit: pageLimit,
            total,
            totalPages: Math.ceil(
                total / pageLimit
            )
        }
    };
};

export const cancelAppointment = async ({
    appointmentId,
    userId,
    role,
    reason = ""
}) => {
    const appointment =
        await Appointment.findById(
            appointmentId
        );

    if (!appointment) {
        throw new ApiError(
            404,
            "Appointment not found"
        );
    }

    const isAdmin =
        role === "admin";

    const isPatient =
        appointment.patient.toString() ===
        userId;

    const isDoctor =
        role === "doctor" &&
        appointment.doctor;

    let doctorUserId = null;

    if (isDoctor) {
        const doctor =
            await DoctorProfile.findById(
                appointment.doctor
            );

        doctorUserId =
            doctor?.user?.toString();
    }

    const isAppointmentDoctor =
        doctorUserId === userId;

    if (
        !isAdmin &&
        !isPatient &&
        !isAppointmentDoctor
    ) {
        throw new ApiError(
            403,
            "You do not have permission to cancel this appointment"
        );
    }

    if (
        !ACTIVE_APPOINTMENT_STATUSES.includes(
            appointment.status
        )
    ) {
        throw new ApiError(
            409,
            "Only active appointments can be cancelled"
        );
    }

    appointment.status =
        APPOINTMENT_STATUS.CANCELLED;

    appointment.cancellationReason =
        reason.trim() || null;

    await appointment.save();

    return populateAppointment(
        Appointment.findById(
            appointment._id
        )
    );
};