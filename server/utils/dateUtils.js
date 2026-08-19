const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDateString = (date) => {
    if (
        typeof date !== "string" ||
        !DATE_PATTERN.test(date)
    ) {
        return false;
    }

    const [year, month, day] =
        date.split("-").map(Number);

    const parsedDate = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

export const getDayOfWeek = (date) => {
    if (!isValidDateString(date)) {
        throw new Error(
            "Invalid date format. Expected YYYY-MM-DD"
        );
    }

    const [year, month, day] =
        date.split("-").map(Number);

    const parsedDate = new Date(
        Date.UTC(year, month - 1, day)
    );

    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ];

    return days[parsedDate.getUTCDay()];
};

export const timeToMinutes = (time) => {
    if (
        typeof time !== "string" ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
    ) {
        throw new Error(
            `Invalid time: ${time}`
        );
    }

    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
    const hours = Math.floor(
        minutes / 60
    );

    const remainingMinutes =
        minutes % 60;

    return [
        String(hours).padStart(2, "0"),
        String(remainingMinutes).padStart(
            2,
            "0"
        )
    ].join(":");
};