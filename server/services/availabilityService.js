import DoctorProfile from "../models/DoctorProfile.js";
import DoctorLeave from "../models/DoctorLeave.js";

import ApiError from "../utils/ApiError.js";

import {
    isValidDateString,
    getDayOfWeek,
    timeToMinutes,
    minutesToTime
} from "../utils/dateUtils.js";

export const getDoctorAvailability =
    async (
        doctorId,
        date
    ) => {
        if (!isValidDateString(date)) {
            throw new ApiError(
                400,
                "Invalid date. Expected YYYY-MM-DD"
            );
        }

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

        const dayOfWeek =
            getDayOfWeek(date);

        const workingDay =
            doctor.workingHours?.[
                dayOfWeek
            ];

        /*
         * Check whether the doctor is
         * on leave for the requested date.
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
         * Doctor does not work on this day.
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

        const startMinutes =
            timeToMinutes(
                workingDay.start
            );

        const endMinutes =
            timeToMinutes(
                workingDay.end
            );

        if (
            startMinutes >= endMinutes
        ) {
            throw new ApiError(
                500,
                `Invalid working hours configured for ${dayOfWeek}`
            );
        }

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

            slots.push({
                start,
                end,
                status: "available"
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