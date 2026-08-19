import mongoose from "mongoose";

const doctorLeaveSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorProfile",
            required: true,
            index: true
        },

        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
            index: true
        },

        reason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Leave reason cannot exceed 500 characters"
            ],
            default: ""
        }
    },
    {
        timestamps: true
    }
);

doctorLeaveSchema.index(
    {
        doctor: 1,
        date: 1
    },
    {
        unique: true
    }
);

const DoctorLeave = mongoose.model(
    "DoctorLeave",
    doctorLeaveSchema
);

export default DoctorLeave;