import { google } from "googleapis";

import DoctorProfile from "../models/DoctorProfile.js";

const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events"
];

const getOAuthClient = () => {
    const clientId =
        process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
        process.env.GOOGLE_CLIENT_SECRET;

    const redirectUri =
        process.env.GOOGLE_REDIRECT_URI;

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri
    ) {
        return null;
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
};

export const isGoogleCalendarConfigured =
    () => {
        return Boolean(
            process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_REDIRECT_URI
        );
    };

export const getGoogleAuthorizationUrl = (
    state
) => {
    const oauthClient =
        getOAuthClient();

    if (!oauthClient) {
        throw new Error(
            "Google Calendar OAuth is not configured"
        );
    }

    return oauthClient.generateAuthUrl({
        access_type: "offline",

        prompt: "consent",

        scope:
            GOOGLE_SCOPES,

        state
    });
};

export const exchangeGoogleCode =
    async (code) => {
        const oauthClient =
            getOAuthClient();

        if (!oauthClient) {
            throw new Error(
                "Google Calendar OAuth is not configured"
            );
        }

        const {
            tokens
        } = await oauthClient.getToken(
            code
        );

        return tokens;
    };

export const saveGoogleCalendarTokens =
    async ({
        doctorId,
        tokens
    }) => {
        const update = {
            "googleCalendar.connected":
                true,

            "googleCalendar.calendarId":
                "primary"
        };

        if (
            tokens.access_token
        ) {
            update[
                "googleCalendar.accessToken"
            ] =
                tokens.access_token;
        }

        if (
            tokens.refresh_token
        ) {
            update[
                "googleCalendar.refreshToken"
            ] =
                tokens.refresh_token;
        }

        if (
            tokens.expiry_date
        ) {
            update[
                "googleCalendar.tokenExpiry"
            ] = new Date(
                tokens.expiry_date
            );
        }

        await DoctorProfile.findByIdAndUpdate(
            doctorId,
            {
                $set: update
            }
        );
    };

const getDoctorCalendarClient =
    async (doctorId) => {
        const doctor =
            await DoctorProfile.findById(
                doctorId
            ).select(
                "+googleCalendar.accessToken " +
                "+googleCalendar.refreshToken " +
                "+googleCalendar.tokenExpiry"
            );

        if (!doctor) {
            throw new Error(
                "Doctor not found"
            );
        }

        if (
            !doctor.googleCalendar
                ?.connected
        ) {
            throw new Error(
                "Doctor Google Calendar is not connected"
            );
        }

        const oauthClient =
            getOAuthClient();

        if (!oauthClient) {
            throw new Error(
                "Google Calendar OAuth is not configured"
            );
        }

        oauthClient.setCredentials({
            access_token:
                doctor.googleCalendar
                    .accessToken,

            refresh_token:
                doctor.googleCalendar
                    .refreshToken,

            expiry_date:
                doctor.googleCalendar
                    .tokenExpiry
                    ?.getTime()
        });

        /*
         * googleapis automatically refreshes
         * the access token when required.
         */
        oauthClient.on(
            "tokens",
            async (tokens) => {
                try {
                    await saveGoogleCalendarTokens(
                        {
                            doctorId,
                            tokens
                        }
                    );
                } catch (error) {
                    console.error(
                        "Failed to persist refreshed Google tokens:",
                        error.message
                    );
                }
            }
        );

        return {
            client:
                oauthClient,

            calendarId:
                doctor.googleCalendar
                    .calendarId ||
                "primary"
        };
    };

export const createCalendarEvent =
    async ({
        doctorId,
        appointment,
        doctor,
        patient
    }) => {
        const {
            client,
            calendarId
        } =
            await getDoctorCalendarClient(
                doctorId
            );

        const calendar =
            google.calendar({
                version: "v3",
                auth: client
            });

        const doctorName =
            doctor?.user?.name ||
            doctor?.name ||
            "Doctor";

        const patientName =
            patient?.name ||
            "Patient";

        const event = {
            summary:
                `MediBridge Appointment - ${patientName}`,

            description:
                `MediBridge appointment with ${doctorName}.\n\n` +
                `Symptoms: ${appointment.symptoms}`,

            start: {
                dateTime:
                    `${appointment.date}T${appointment.startTime}:00`,
                timeZone:
                    process.env.APP_TIMEZONE ||
                    "Asia/Kolkata"
            },

            end: {
                dateTime:
                    `${appointment.date}T${appointment.endTime}:00`,
                timeZone:
                    process.env.APP_TIMEZONE ||
                    "Asia/Kolkata"
            },

            attendees: [
                ...(patient?.email
                    ? [
                          {
                              email:
                                  patient.email
                          }
                      ]
                    : []),

                ...(doctor?.user?.email
                    ? [
                          {
                              email:
                                  doctor.user
                                      .email
                          }
                      ]
                    : [])
            ]
        };

        const response =
            await calendar.events.insert({
                calendarId,
                requestBody:
                    event,

                sendUpdates:
                    "all"
            });

        return response.data;
    };

export const deleteCalendarEvent =
    async ({
        doctorId,
        eventId
    }) => {
        if (!eventId) {
            return;
        }

        const {
            client,
            calendarId
        } =
            await getDoctorCalendarClient(
                doctorId
            );

        const calendar =
            google.calendar({
                version: "v3",
                auth: client
            });

        try {
            await calendar.events.delete({
                calendarId,
                eventId,

                sendUpdates:
                    "all"
            });
        } catch (error) {
            /*
             * 404 means the event has already
             * disappeared from the calendar.
             *
             * Treat that as effectively deleted.
             */
            if (
                error.code === 404
            ) {
                return;
            }

            throw error;
        }
    };