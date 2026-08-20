import mongoose from "mongoose";

const medicationReminderSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        consultation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Consultation",
            required: true,
            index: true
        },

        medicineName: {
            type: String,
            required: true,
            trim: true
        },

        dosage: {
            type: String,
            required: true,
            trim: true
        },

        instructions: {
            type: String,
            trim: true,
            default: ""
        },

        scheduledTime: {
            type: Date,

            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ["pending", "sent", "failed"],
            default: "pending",
            index: true
        },

        sentAt: {
            type: Date,
            default: null
        },

        retryCount: {
            type: Number,
            default: 0
        },

        errorMessage: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const MedicationReminder = mongoose.model("MedicationReminder", medicationReminderSchema);

export default MedicationReminder;
