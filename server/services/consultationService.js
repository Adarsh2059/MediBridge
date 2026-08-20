import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import Appointment from "../models/Appointment.js";
import DoctorProfile from "../models/DoctorProfile.js";
import MedicationReminder from "../models/MedicationReminder.js";
import { generatePostVisitSummary } from "./aiService.js";
import { parsePostVisitResponse } from "../utils/aiResponseParser.js";
import { APPOINTMENT_STATUS } from "../constants/appointmentStatus.js";
import ApiError from "../utils/ApiError.js";

const parseDurationDays = (durationStr) => {
    if (!durationStr) return 5;
    const match = durationStr.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    const clean = durationStr.toLowerCase();
    if (clean.includes("week")) return 7;
    if (clean.includes("month")) return 30;
    if (clean.includes("one")) return 1;
    if (clean.includes("two")) return 2;
    if (clean.includes("three")) return 3;
    if (clean.includes("four")) return 4;
    if (clean.includes("five")) return 5;
    if (clean.includes("six")) return 6;
    if (clean.includes("seven")) return 7;
    if (clean.includes("ten")) return 10;
    return 5;
};

const parseFrequencyTimes = (freqStr) => {
    if (!freqStr) return 1;
    const clean = freqStr.toLowerCase();
    if (clean.includes("once") || clean.includes("daily") || clean.includes("1 time") || clean.includes("1x")) {
        return 1;
    }
    if (clean.includes("twice") || clean.includes("2 times") || clean.includes("2x")) {
        return 2;
    }
    if (clean.includes("three") || clean.includes("3 times") || clean.includes("3x") || clean.includes("thrice")) {
        return 3;
    }
    if (clean.includes("four") || clean.includes("4 times") || clean.includes("4x")) {
        return 4;
    }
    const match = freqStr.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }
    return 1;
};

const scheduleMedicationReminders = async ({ patientId, consultationId, prescription }) => {
    if (!prescription || prescription.length === 0) return;

    const scheduledReminders = [];
    const now = new Date();

    for (const item of prescription) {
        const days = parseDurationDays(item.duration);
        const times = parseFrequencyTimes(item.frequency);

        for (let d = 0; d < days; d++) {
            const baseDate = new Date();
            baseDate.setDate(now.getDate() + d);
            baseDate.setSeconds(0);
            baseDate.setMilliseconds(0);

            const timesList = [];
            if (times === 1) {
                timesList.push({ h: 9, m: 0 }); // Morning
            } else if (times === 2) {
                timesList.push({ h: 9, m: 0 }); // Morning
                timesList.push({ h: 21, m: 0 }); // Evening
            } else if (times === 3) {
                timesList.push({ h: 9, m: 0 });
                timesList.push({ h: 15, m: 0 });
                timesList.push({ h: 21, m: 0 });
            } else {
                timesList.push({ h: 9, m: 0 });
                timesList.push({ h: 13, m: 0 });
                timesList.push({ h: 17, m: 0 });
                timesList.push({ h: 21, m: 0 });
            }

            for (const time of timesList) {
                const scheduledTime = new Date(baseDate);
                scheduledTime.setHours(time.h, time.m);
                if (scheduledTime > now) {
                    scheduledReminders.push({
                        patient: patientId,
                        consultation: consultationId,
                        medicineName: item.medicine,
                        dosage: item.dosage,
                        instructions: item.instructions || "",
                        scheduledTime,
                        status: "pending"
                    });
                }
            }
        }
    }

    if (scheduledReminders.length > 0) {
        await MedicationReminder.insertMany(scheduledReminders);
    }
};

export const generateAiConsultationSummary = async (consultationId) => {
    let consultation;
    try {
        consultation = await Consultation.findById(consultationId);
        if (!consultation) return;

        consultation.aiStatus = "processing";
        await consultation.save();

        const aiResult = await generatePostVisitSummary({
            clinicalNotes: consultation.clinicalNotes,
            prescription: consultation.prescription,
            followUpInstructions: consultation.followUpInstructions
        });

        const parsed = parsePostVisitResponse(aiResult.text);

        consultation.aiSummary = parsed;
        consultation.aiStatus = "completed";
        consultation.aiModel = aiResult.model;
        consultation.promptVersion = aiResult.promptVersion;
        consultation.aiError = null;
        await consultation.save();
    } catch (error) {
        console.error("Async AI consultation summary generation failed:", error.message);
        if (consultation) {
            consultation.aiStatus = "failed";
            consultation.aiError = error.message;
            await consultation.save();
        }
    }
};

export const createConsultation = async ({
    appointmentId,
    doctorUserId,
    clinicalNotes,
    diagnosis = "",
    prescription = [],
    followUpInstructions = ""
}) => {
    if (!clinicalNotes || !clinicalNotes.trim()) {
        throw new ApiError(400, "Clinical notes are required");
    }

    const doctorProfile = await DoctorProfile.findOne({ user: doctorUserId });
    if (!doctorProfile) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
        throw new ApiError(403, "You do not have permission to submit consultation for this appointment");
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
        throw new ApiError(409, "Consultation has already been completed for this appointment");
    }

    // Create consultation
    const consultation = await Consultation.create({
        appointment: appointmentId,
        patient: appointment.patient,
        doctor: doctorProfile._id,
        clinicalNotes: clinicalNotes.trim(),
        diagnosis: diagnosis.trim(),
        prescription,
        followUpInstructions: followUpInstructions.trim(),
        aiStatus: "processing"
    });

    // Mark appointment as completed
    appointment.status = APPOINTMENT_STATUS.COMPLETED;
    await appointment.save();

    // Schedule reminders
    try {
        await scheduleMedicationReminders({
            patientId: appointment.patient,
            consultationId: consultation._id,
            prescription
        });
    } catch (error) {
        console.error("Failed to schedule medication reminders:", error.message);
    }

    // Trigger AI summary asynchronously
    generateAiConsultationSummary(consultation._id).catch(err => {
        console.error("Async trigger for consultation summary failed:", err);
    });

    return consultation;
};

export const getConsultationByAppointment = async ({ appointmentId, userId, role }) => {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new ApiError(400, "Invalid appointment ID");
    }

    const consultation = await Consultation.findOne({ appointment: appointmentId })
        .populate({
            path: "patient",
            select: "name email phone"
        })
        .populate({
            path: "doctor",
            populate: {
                path: "user",
                select: "name email phone"
            }
        });

    if (!consultation) {
        throw new ApiError(404, "Consultation details not found");
    }

    const isAdmin = role === "admin";
    const isPatient = consultation.patient?._id.toString() === userId;
    const isDoctor = consultation.doctor?.user?._id.toString() === userId;

    if (!isAdmin && !isPatient && !isDoctor) {
        throw new ApiError(403, "You do not have permission to access this consultation");
    }

    return consultation;
};
