import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import AppointmentHold from "../models/AppointmentHold.js";
import DoctorProfile from "../models/DoctorProfile.js";
import User from "../models/User.js";

import {
    notifyAppointmentConfirmed
} from "./notificationService.js";

import {
    createCalendarEvent,
    deleteCalendarEvent
} from "./googleCalendarService.js";

import {
    APPOINTMENT_STATUS,
    ACTIVE_APPOINTMENT_STATUSES
} from "../constants/appointmentStatus.js";

import ApiError from "../utils/ApiError.js";

import {
    getDoctorAvailability
} from "./availabilityService.js";

import {
    isValidDateString
} from "../utils/dateUtils.js";

import {
    createPreVisitAssessment
} from "./preVisitService.js";

const HOLD_DURATION_MINUTES = 5;

const populateAppointment = (
    query
) => {
    return query
        .populate({
            path: "doctor",
            populate: {
                path: "user",
                select:
                    "name email phone"
            }
        })
        .populate({
            path: "patient",
            select:
                "name email phone"
        })
        .populate({
            path: "rescheduledFrom",
            select:
                "date startTime endTime status"
        })
        .populate({
            path: "rescheduledTo",
            select:
                "date startTime endTime status"
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
            select:
                "name email isActive role"
        });

    if (
        !doctor ||
        !doctor.user ||
        doctor.user.role !==
            "doctor"
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
    endTime,
    allowedHoldId = null
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
                slot.start ===
                    startTime &&
                slot.end ===
                    endTime
        );

    if (!matchingSlot) {
        throw new ApiError(
            409,
            "Selected slot is not part of the doctor's availability"
        );
    }

    /*
     * Available slot → valid.
     */
    if (
        matchingSlot.status ===
        "available"
    ) {
        return;
    }

    /*
     * Booked slot → never available.
     */
    if (
        matchingSlot.status ===
        "booked"
    ) {
        throw new ApiError(
            409,
            "This slot has already been booked"
        );
    }

    /*
     * Held slot.
     *
     * This requires special handling because
     * the current patient may already own
     * the hold.
     */
    if (
        matchingSlot.status ===
        "held"
    ) {
        if (allowedHoldId) {
            const ownHold =
                await AppointmentHold.findOne(
                    {
                        _id:
                            allowedHoldId,
                        doctor:
                            doctorId,
                        date,
                        startTime,
                        endTime,
                        expiresAt: {
                            $gt:
                                new Date()
                        }
                    }
                ).lean();

            if (ownHold) {
                return;
            }
        }

        throw new ApiError(
            409,
            "This slot is currently being held by another patient"
        );
    }

    throw new ApiError(
        409,
        "Selected slot is not available"
    );
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
     * MongoDB TTL deletion is asynchronous.
     *
     * Remove expired holds explicitly before
     * creating a new hold.
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
        /*
         * Unique index prevents two simultaneous
         * holds for the same doctor/date/startTime.
         */
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
    /*
     * Symptoms are mandatory before booking.
     */
    if (!symptoms?.trim()) {
        throw new ApiError(
            400,
            "Symptoms are required before confirming an appointment"
        );
    }

    const cleanedSymptoms =
        symptoms.trim();

    const cleanedBookingNotes =
        bookingNotes?.trim() || "";

    /*
     * Validate patient's active hold.
     */
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

    await ensureDoctorExists(
        hold.doctor
    );

    /*
     * Revalidate availability immediately
     * before booking.
     */
    await validateSlot({
    doctorId: hold.doctor,
    date: hold.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    allowedHoldId: hold._id
});

    /*
     * --------------------------------------------------
     * CRITICAL BOOKING TRANSACTION
     * --------------------------------------------------
     *
     * Appointment creation and hold deletion
     * happen atomically.
     */
    const session =
        await mongoose.startSession();

    let appointment;

    try {
        session.startTransaction();

        /*
         * Final conflict check inside
         * the transaction.
         */
        const conflictingAppointment =
            await Appointment.findOne({
                doctor: hold.doctor,
                date: hold.date,
                startTime:
                    hold.startTime,
                status: {
                    $in:
                        ACTIVE_APPOINTMENT_STATUSES
                }
            }).session(session);

        if (
            conflictingAppointment
        ) {
            throw new ApiError(
                409,
                "This slot has already been booked"
            );
        }

        /*
         * Create appointment.
         */
        const createdAppointments =
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
                            cleanedSymptoms,

                        bookingNotes:
                            cleanedBookingNotes,

                        /*
                         * Calendar is not yet synchronized.
                         */
                        googleCalendarSyncStatus:
                            "not_configured"
                    }
                ],
                {
                    session
                }
            );

        appointment =
            createdAppointments[0];

        /*
         * Consume temporary hold.
         */
        await AppointmentHold.deleteOne({
            _id: hold._id
        }).session(session);

        /*
         * IMPORTANT:
         *
         * Commit the appointment BEFORE calling
         * any external service.
         *
         * Gemini/email/calendar failures cannot
         * roll back the booking.
         */
        await session.commitTransaction();
    } catch (error) {
        if (
            session.inTransaction()
        ) {
            await session.abortTransaction();
        }

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

    /*
     * --------------------------------------------------
     * AI PRE-VISIT ANALYSIS
     * --------------------------------------------------
     *
     * AI failure does NOT affect the appointment.
     */
    try {
        await createPreVisitAssessment({
            appointmentId:
                appointment._id,

            patientId,

            symptoms:
                cleanedSymptoms
        });
    } catch (error) {
        console.error(
            "AI pre-visit analysis failed after appointment booking:",
            error.message
        );
    }

    /*
     * --------------------------------------------------
     * APPOINTMENT CONFIRMATION EMAIL
     * --------------------------------------------------
     *
     * Email failure does NOT affect the appointment.
     */
    try {
        const notificationAppointment =
            await populateAppointment(
                Appointment.findById(
                    appointment._id
                )
            );

        await notifyAppointmentConfirmed({
            patient:
                notificationAppointment
                    .patient,

            doctor:
                notificationAppointment
                    .doctor,

            appointment:
                notificationAppointment
        });
    } catch (error) {
        console.error(
            "Appointment confirmation notification failed:",
            error.message
        );
    }

    /*
     * --------------------------------------------------
     * GOOGLE CALENDAR SYNCHRONIZATION
     * --------------------------------------------------
     *
     * Calendar is an external integration.
     *
     * If the doctor has not connected Google
     * Calendar, leave the status as:
     *
     *     not_configured
     *
     * If Google Calendar fails:
     *
     *     failed
     *
     * The appointment remains BOOKED.
     */
    try {
        const calendarAppointment =
            await populateAppointment(
                Appointment.findById(
                    appointment._id
                )
            );

        const doctor =
            calendarAppointment.doctor;

        const isCalendarConnected =
            doctor?.googleCalendar
                ?.connected === true;

        if (
            !isCalendarConnected
        ) {
            appointment.googleCalendarSyncStatus =
                "not_configured";

            appointment.googleCalendarSyncError =
                null;

            await appointment.save();
        } else {
            const calendarEvent =
                await createCalendarEvent({
                    doctorId:
                        appointment.doctor,

                    appointment:
                        calendarAppointment,

                    doctor:
                        calendarAppointment
                            .doctor,

                    patient:
                        calendarAppointment
                            .patient
                });

            appointment.googleCalendarEventId =
                calendarEvent.id;

            appointment.googleCalendarSyncStatus =
                "synced";

            appointment.googleCalendarSyncError =
                null;

            await appointment.save();
        }
    } catch (error) {
        console.error(
            "Google Calendar synchronization failed:",
            error.message
        );

        appointment.googleCalendarSyncStatus =
            "failed";

        appointment.googleCalendarSyncError =
            error.message;

        await appointment.save();
    }

    /*
     * Fetch final populated appointment.
     */
    const populatedAppointment =
        await populateAppointment(
            Appointment.findById(
                appointment._id
            )
        );

    return populatedAppointment;
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
    const currentPage =
        Math.max(
            Number(page) || 1,
            1
        );

    const pageLimit =
        Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            50
        );

    const filter = {};

    /*
     * Patient → own appointments.
     */
    if (
        role === "patient"
    ) {
        filter.patient =
            userId;
    }

    /*
     * Doctor → own appointments.
     */
    else if (
        role === "doctor"
    ) {
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

    /*
     * Admin has no ownership filter.
     */
    if (status) {
        filter.status =
            status;
    }

    if (date) {
        if (
            !isValidDateString(
                date
            )
        ) {
            throw new ApiError(
                400,
                "Invalid date. Expected YYYY-MM-DD"
            );
        }

        filter.date =
            date;
    }

    const skip =
        (currentPage - 1) *
        pageLimit;

    const [
        appointments,
        total
    ] = await Promise.all([
        populateAppointment(
            Appointment.find(
                filter
            )
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
            page:
                currentPage,

            limit:
                pageLimit,

            total,

            totalPages:
                Math.ceil(
                    total /
                        pageLimit
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

    let doctorUserId =
        null;

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

    /*
     * --------------------------------------------------
     * GOOGLE CALENDAR EVENT REMOVAL
     * --------------------------------------------------
     *
     * The appointment is already cancelled in
     * MediBridge.
     *
     * Calendar deletion is best-effort.
     */
    if (
        appointment.googleCalendarEventId
    ) {
        try {
            await deleteCalendarEvent({
                doctorId:
                    appointment.doctor,

                eventId:
                    appointment.googleCalendarEventId
            });

            appointment.googleCalendarEventId =
                null;

            appointment.googleCalendarSyncStatus =
                "not_configured";

            appointment.googleCalendarSyncError =
                null;

            await appointment.save();
        } catch (error) {
            console.error(
                "Failed to remove Google Calendar event:",
                error.message
            );

            appointment.googleCalendarSyncStatus =
                "failed";

            appointment.googleCalendarSyncError =
                error.message;

            await appointment.save();
        }
    }

    return populateAppointment(
        Appointment.findById(
            appointment._id
        )
    );
};