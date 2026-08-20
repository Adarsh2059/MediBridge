import mongoose from "mongoose";

const emailQueueSchema = new mongoose.Schema(
    {
        to: {
            type: String,
            required: true,
            trim: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        text: {
            type: String,
            default: ""
        },

        html: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["pending", "sent", "failed"],
            default: "pending",
            index: true
        },

        retryCount: {
            type: Number,
            default: 0,
            index: true
        },

        lastError: {
            type: String,
            default: null
        },

        nextAttemptAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

const EmailQueue = mongoose.model("EmailQueue", emailQueueSchema);

export default EmailQueue;
