import DoctorProfile from "../models/DoctorProfile.js";
import DoctorLeave from "../models/DoctorLeave.js";
import Appointment from "../models/Appointment.js";
import AppointmentHold from "../models/AppointmentHold.js";

import ApiError from "../utils/ApiError.js";

import {
    isValidDateString,
    getDayOfWeek,
    timeToMinutes,
    minutesToTime
} from "../utils/dateUtils.js";

import {
    ACTIVE_APPOINTMENT_STATUSES
} from "../constants/appointmentStatus.js";

export const getDoctorAvailability = async (
    doctorId,
    date
) => {
    /*
     * Validate requested date.
     */
    if (!isValidDateString(date)) {
        throw new ApiError(
            400,
            "Invalid date. Expected YYYY-MM-DD"
        );
    }

    /*
     * Fetch doctor profile.
     */
    const doctor =
        await DoctorProfile.findById(
            doctorId
        ).lean();

    if (!doctor) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    /*
     * Determine the day of the week.
     */
    const dayOfWeek =
        getDayOfWeek(date);

    const workingDay =
        doctor.workingHours?.[
            dayOfWeek
        ];

    /*
     * Check whether the doctor
     * is on leave.
     */
    const leave =
        await DoctorLeave.findOne({
            doctor: doctorId,
            date
        }).lean();

    if (leave) {
        return {
            doctorId,
            date,
            dayOfWeek,
            isOnLeave: true,
            workingHours: null,
            slotDuration:
                doctor.slotDuration,
            slots: []
        };
    }

    /*
     * Doctor does not work
     * on this day.
     */
    if (
        !workingDay ||
        !workingDay.enabled
    ) {
        return {
            doctorId,
            date,
            dayOfWeek,
            isOnLeave: false,
            workingHours: null,
            slotDuration:
                doctor.slotDuration,
            slots: []
        };
    }

    /*
     * Convert working hours into minutes.
     */
    const startMinutes =
        timeToMinutes(
            workingDay.start
        );

    const endMinutes =
        timeToMinutes(
            workingDay.end
        );

    /*
     * Protect against invalid
     * working-hour configuration.
     */
    if (
        startMinutes >= endMinutes
    ) {
        throw new ApiError(
            500,
            `Invalid working hours configured for ${dayOfWeek}`
        );
    }

    /*
     * Fetch active appointments for
     * the selected doctor and date.
     *
     * These slots will be marked as BOOKED.
     */
    const appointments =
        await Appointment.find({
            doctor: doctorId,
            date,
            status: {
                $in:
                    ACTIVE_APPOINTMENT_STATUSES
            }
        })
            .select(
                "startTime endTime status"
            )
            .lean();

    /*
     * Fetch active temporary holds.
     *
     * We explicitly check expiresAt because
     * MongoDB TTL cleanup is asynchronous.
     */
    const holds =
        await AppointmentHold.find({
            doctor: doctorId,
            date,
            expiresAt: {
                $gt: new Date()
            }
        })
            .select(
                "startTime endTime expiresAt"
            )
            .lean();

    /*
     * Convert booked start times into
     * a Set for fast lookup.
     */
    const bookedTimes = new Set(
        appointments.map(
            (appointment) =>
                appointment.startTime
        )
    );

    /*
     * Convert held start times into
     * a Set for fast lookup.
     */
    const heldTimes = new Set(
        holds.map(
            (hold) =>
                hold.startTime
        )
    );

    /*
     * Generate slots according to
     * doctor's working hours and
     * configured slot duration.
     */
    const slots = [];

    for (
        let current = startMinutes;

        current + doctor.slotDuration <=
        endMinutes;

        current += doctor.slotDuration
    ) {
        const start =
            minutesToTime(
                current
            );

        const end =
            minutesToTime(
                current +
                    doctor.slotDuration
            );

        /*
         * Default slot state.
         */
        let status = "available";

        /*
         * A booked slot has priority.
         */
        if (
            bookedTimes.has(start)
        ) {
            status = "booked";
        }

        /*
         * If the slot is not booked but
         * is temporarily held, mark it held.
         */
        else if (
            heldTimes.has(start)
        ) {
            status = "held";
        }

        slots.push({
            start,
            end,
            status
        });
    }

    return {
        doctorId,
        date,
        dayOfWeek,
        isOnLeave: false,

        workingHours: {
            start: workingDay.start,
            end: workingDay.end
        },

        slotDuration:
            doctor.slotDuration,

        slots
    };
};