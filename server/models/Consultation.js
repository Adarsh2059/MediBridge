import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema(
    {
        medicine: {
            type: String,
            required: [true, "Medicine name is required"],
            trim: true
        },
        dosage: {
            type: String,
            required: [true, "Dosage is required"],
            trim: true
        },
        frequency: {
            type: String,
            required: [true, "Frequency is required"],
            trim: true
        },
        duration: {
            type: String,
            required: [true, "Duration is required"],
            trim: true
        },
        instructions: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { _id: false }
);

const consultationSchema = new mongoose.Schema(
    {
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            unique: true,
            index: true
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorProfile",
            required: true,
            index: true
        },

        clinicalNotes: {
            type: String,
            required: [true, "Clinical notes are required"],
            trim: true
        },

        diagnosis: {
            type: String,
            trim: true,
            default: ""
        },

        prescription: {
            type: [prescriptionItemSchema],
            default: []
        },

        followUpInstructions: {
            type: String,
            trim: true,
            default: ""
        },

        aiSummary: {
            summary: {
                type: String,
                default: null
            },
            medicationSchedule: {
                type: [
                    new mongoose.Schema(
                        {
                            medicine: { type: String, required: true },
                            instructions: { type: String, required: true }
                        },
                        { _id: false }
                    )
                ],
                default: []
            },
            followUpSteps: {
                type: [String],
                default: []
            }
        },

        aiStatus: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
            index: true
        },

        aiError: {
            type: String,
            default: null
        },

        aiModel: {
            type: String,
            default: null
        },

        promptVersion: {
            type: String,
            default: "v1"
        }
    },
    {
        timestamps: true
    }
);

const Consultation = mongoose.model("Consultation", consultationSchema);

export default Consultation;
