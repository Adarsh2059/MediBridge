export const APPOINTMENT_STATUS = Object.freeze({
    BOOKED: "booked",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    RESCHEDULED: "rescheduled"
});

export const ACTIVE_APPOINTMENT_STATUSES = Object.freeze([
    APPOINTMENT_STATUS.BOOKED,
    APPOINTMENT_STATUS.CONFIRMED
]);

export const APPOINTMENT_STATUS_VALUES = Object.values(
    APPOINTMENT_STATUS
);