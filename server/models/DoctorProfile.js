import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
    {
        start: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        end: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        }
    },
    {
        _id: false
    }
);

const workingDaySchema = new mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: false
        },

        start: {
            type: String,
            default: null,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        end: {
            type: String,
            default: null,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        }
    },
    {
        _id: false
    }
);

const doctorProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        specialization: {
            type: String,
            required: [true, "Specialization is required"],
            trim: true,
            maxlength: [100, "Specialization cannot exceed 100 characters"],
            index: true
        },

        qualification: {
            type: String,
            required: [true, "Qualification is required"],
            trim: true,
            maxlength: [200, "Qualification cannot exceed 200 characters"]
        },

        experience: {
            type: Number,
            required: [true, "Experience is required"],
            min: [0, "Experience cannot be negative"],
            max: [70, "Experience cannot exceed 70 years"]
        },

        consultationFee: {
            type: Number,
            required: [true, "Consultation fee is required"],
            min: [0, "Consultation fee cannot be negative"]
        },

        bio: {
            type: String,
            trim: true,
            maxlength: [1000, "Bio cannot exceed 1000 characters"],
            default: ""
        },

        slotDuration: {
            type: Number,
            required: true,
            enum: [15, 20, 30, 45, 60],
            default: 30
        },

        workingHours: {
            monday: {
                type: workingDaySchema,
                default: () => ({})
            },

            tuesday: {
                type: workingDaySchema,
                default: () => ({})
            },

            wednesday: {
                type: workingDaySchema,
                default: () => ({})
            },

            thursday: {
                type: workingDaySchema,
                default: () => ({})
            },

            friday: {
                type: workingDaySchema,
                default: () => ({})
            },

            saturday: {
                type: workingDaySchema,
                default: () => ({})
            },

            sunday: {
                type: workingDaySchema,
                default: () => ({})
            }
        }
    },
    {
        timestamps: true
    }
);

const DoctorProfile = mongoose.model(
    "DoctorProfile",
    doctorProfileSchema
);

export default DoctorProfile;