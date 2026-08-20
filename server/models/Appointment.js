import mongoose from "mongoose";

import {
    APPOINTMENT_STATUS_VALUES,
    APPOINTMENT_STATUS,
    ACTIVE_APPOINTMENT_STATUSES
} from "../constants/appointmentStatus.js";

const appointmentSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorProfile",
            required: true,
            index: true
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
            index: true
        },

        startTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        endTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        status: {
            type: String,
            enum: APPOINTMENT_STATUS_VALUES,
            default: APPOINTMENT_STATUS.BOOKED,
            required: true,
            index: true
        },

        symptoms: {
            type: String,
            trim: true,
            maxlength: [
                3000,
                "Symptoms cannot exceed 3000 characters"
            ],
            required: true
        },

        bookingNotes: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Booking notes cannot exceed 1000 characters"
            ],
            default: ""
        },

        cancellationReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Cancellation reason cannot exceed 500 characters"
            ],
            default: null
        },

        /*
         * Google Calendar integration.
         *
         * These fields are intentionally kept on the
         * appointment rather than making Google Calendar
         * the source of truth.
         */
        googleCalendarEventId: {
            type: String,
            trim: true,
            default: null,
            index: true
        },

        googleCalendarSyncStatus: {
            type: String,
            enum: [
                "pending",
                "synced",
                "failed",
                "not_configured"
            ],
            default: "pending",
            index: true
        },

        googleCalendarSyncError: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null
        },

        rescheduledFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            default: null
        },

        rescheduledTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            default: null
        }
    },
    {
        timestamps: true
    }
);

/*
 * Database-level double-booking protection.
 *
 * Only active appointments participate in
 * the unique constraint.
 */
appointmentSchema.index(
    {
        doctor: 1,
        date: 1,
        startTime: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in:
                    ACTIVE_APPOINTMENT_STATUSES
            }
        }
    }
);

appointmentSchema.index({
    patient: 1,
    date: -1
});

appointmentSchema.index({
    doctor: 1,
    date: -1
});

const Appointment =
    mongoose.model(
        "Appointment",
        appointmentSchema
    );

export default Appointment;