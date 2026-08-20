import crypto from "crypto";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

import DoctorProfile from "../models/DoctorProfile.js";

import {
    getGoogleAuthorizationUrl,
    exchangeGoogleCode,
    saveGoogleCalendarTokens
} from "../services/googleCalendarService.js";

const generateState = (doctorId) => {
    const payload = {
        doctorId,
        nonce:
            crypto.randomBytes(16).toString("hex")
    };

    return Buffer.from(
        JSON.stringify(payload)
    ).toString("base64url");
};

const decodeState = (state) => {
    try {
        return JSON.parse(
            Buffer.from(
                state,
                "base64url"
            ).toString("utf-8")
        );
    } catch {
        throw new ApiError(
            400,
            "Invalid Google OAuth state"
        );
    }
};

export const connectGoogleCalendar =
    asyncHandler(
        async (req, res) => {
            if (
                req.user.role !==
                "doctor"
            ) {
                throw new ApiError(
                    403,
                    "Only doctors can connect Google Calendar"
                );
            }

            const doctor =
                await DoctorProfile.findOne({
                    user: req.user.id
                });

            if (!doctor) {
                throw new ApiError(
                    404,
                    "Doctor profile not found"
                );
            }

            const state =
                generateState(
                    doctor._id.toString()
                );

            const authorizationUrl =
                getGoogleAuthorizationUrl(
                    state
                );

            res.status(200).json({
                success: true,
                data: {
                    authorizationUrl
                }
            });
        }
    );

export const googleCalendarCallback =
    asyncHandler(
        async (req, res) => {
            const {
                code,
                state,
                error
            } = req.query;

            if (error) {
                throw new ApiError(
                    400,
                    `Google authorization failed: ${error}`
                );
            }

            if (!code || !state) {
                throw new ApiError(
                    400,
                    "Google authorization code and state are required"
                );
            }

            const {
                doctorId
            } = decodeState(state);

            const doctor =
                await DoctorProfile.findById(
                    doctorId
                );

            if (!doctor) {
                throw new ApiError(
                    404,
                    "Doctor profile not found"
                );
            }

            const tokens =
                await exchangeGoogleCode(
                    code
                );

            await saveGoogleCalendarTokens({
                doctorId,
                tokens
            });

            res.status(200).json({
                success: true,
                message:
                    "Google Calendar connected successfully"
            });
        }
    );

export const getCalendarStatus =
    asyncHandler(
        async (req, res) => {
            if (
                req.user.role !==
                "doctor"
            ) {
                throw new ApiError(
                    403,
                    "Only doctors can access Google Calendar status"
                );
            }

            const doctor =
                await DoctorProfile.findOne({
                    user: req.user.id
                }).select(
                    "googleCalendar.connected googleCalendar.calendarId"
                );

            if (!doctor) {
                throw new ApiError(
                    404,
                    "Doctor profile not found"
                );
            }

            res.status(200).json({
                success: true,
                data: {
                    connected:
                        doctor.googleCalendar
                            ?.connected ||
                        false,

                    calendarId:
                        doctor.googleCalendar
                            ?.calendarId ||
                        null
                }
            });
        }
    );