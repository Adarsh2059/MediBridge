import mongoose from "mongoose";

const suggestedQuestionSchema =
    new mongoose.Schema(
        {
            question: {
                type: String,
                required: true,
                trim: true,
                maxlength: 500
            }
        },
        {
            _id: false
        }
    );

const preVisitAssessmentSchema =
    new mongoose.Schema(
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

            symptoms: {
                type: String,
                required: true,
                trim: true,
                maxlength: 3000
            },

            status: {
                type: String,
                enum: [
                    "pending",
                    "processing",
                    "completed",
                    "failed"
                ],
                default: "pending",
                index: true
            },

            urgency: {
                type: String,
                enum: [
                    "low",
                    "medium",
                    "high"
                ],
                default: null
            },

            chiefComplaint: {
                type: String,
                trim: true,
                maxlength: 1000,
                default: null
            },

            suggestedQuestions: {
                type: [
                    suggestedQuestionSchema
                ],
                default: []
            },

            model: {
                type: String,
                default: null
            },

            promptVersion: {
                type: String,
                default: "v1"
            },

            rawResponse: {
                type: String,
                default: null
            },

            errorMessage: {
                type: String,
                default: null
            },

            processedAt: {
                type: Date,
                default: null
            }
        },
        {
            timestamps: true
        }
    );

const PreVisitAssessment =
    mongoose.model(
        "PreVisitAssessment",
        preVisitAssessmentSchema
    );

export default PreVisitAssessment;