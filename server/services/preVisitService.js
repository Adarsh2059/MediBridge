import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import PreVisitAssessment from "../models/PreVisitAssessment.js";

import ApiError from "../utils/ApiError.js";

import {
    generatePreVisitAssessment
} from "./aiService.js";

import {
    parsePreVisitResponse
} from "../utils/aiResponseParser.js";

const getAppointmentForPatient =
    async (
        appointmentId,
        patientId
    ) => {
        if (
            !mongoose.Types.ObjectId.isValid(
                appointmentId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid appointment ID"
            );
        }

        const appointment =
            await Appointment.findOne({
                _id: appointmentId,
                patient: patientId
            });

        if (!appointment) {
            throw new ApiError(
                404,
                "Appointment not found"
            );
        }

        return appointment;
    };

export const createPreVisitAssessment =
    async ({
        appointmentId,
        patientId,
        symptoms
    }) => {
        if (
            typeof symptoms !== "string" ||
            !symptoms.trim()
        ) {
            throw new ApiError(
                400,
                "Symptoms are required"
            );
        }

        if (
            symptoms.trim().length < 10
        ) {
            throw new ApiError(
                400,
                "Please provide more detail about your symptoms"
            );
        }

        const appointment =
            await getAppointmentForPatient(
                appointmentId,
                patientId
            );

        /*
         * Prevent unnecessary duplicate
         * AI requests.
         */
        const existing =
            await PreVisitAssessment.findOne(
                {
                    appointment:
                        appointment._id
                }
            );

        if (
            existing &&
            existing.status ===
                "completed"
        ) {
            return existing;
        }

        let assessment;

        if (existing) {
            assessment = existing;

            assessment.symptoms =
                symptoms.trim();

            assessment.status =
                "processing";

            assessment.errorMessage =
                null;

            await assessment.save();
        } else {
            assessment =
                await PreVisitAssessment.create(
                    {
                        appointment:
                            appointment._id,

                        patient:
                            appointment.patient,

                        doctor:
                            appointment.doctor,

                        symptoms:
                            symptoms.trim(),

                        status:
                            "processing"
                    }
                );
        }

        try {
            const aiResult =
                await generatePreVisitAssessment(
                    symptoms.trim()
                );

            const parsed =
                parsePreVisitResponse(
                    aiResult.text
                );

            assessment.status =
                "completed";

            assessment.urgency =
                parsed.urgency;

            assessment.chiefComplaint =
                parsed.chiefComplaint;

            assessment.suggestedQuestions =
                parsed.suggestedQuestions;

            assessment.model =
                aiResult.model;

            assessment.promptVersion =
                aiResult.promptVersion;

            assessment.rawResponse =
                aiResult.text;

            assessment.errorMessage =
                null;

            assessment.processedAt =
                new Date();

            await assessment.save();

            return assessment;
        } catch (error) {
            console.error(
                "Pre-visit assessment failed:",
                error.message
            );

            assessment.status =
                "failed";

            assessment.errorMessage =
                error.message;

            assessment.processedAt =
                new Date();

            await assessment.save();

            /*
             * IMPORTANT:
             *
             * We deliberately rethrow the error here.
             *
             * The appointment booking service must decide
             * whether AI failure should block booking.
             *
             * In our final booking flow, AI failure will
             * NOT block the appointment.
             */
            throw error;
        }
    };

export const getPreVisitAssessment =
    async ({
        appointmentId,
        userId,
        role
    }) => {
        if (
            !mongoose.Types.ObjectId.isValid(
                appointmentId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid appointment ID"
            );
        }

        const assessment =
            await PreVisitAssessment.findOne(
                {
                    appointment:
                        appointmentId
                }
            )
                .populate({
                    path: "patient",
                    select:
                        "name email phone"
                })
                .populate({
                    path: "doctor",
                    populate: {
                        path: "user",
                        select:
                            "name email phone"
                    }
                })
                .lean();

        if (!assessment) {
            throw new ApiError(
                404,
                "Pre-visit assessment not found"
            );
        }

        const isAdmin =
            role === "admin";

        const isPatient =
            assessment.patient?._id?.toString() ===
            userId;

        const isDoctor =
            assessment.doctor?.user?._id?.toString() ===
            userId;

        if (
            !isAdmin &&
            !isPatient &&
            !isDoctor
        ) {
            throw new ApiError(
                403,
                "You do not have permission to access this assessment"
            );
        }

        return assessment;
    };