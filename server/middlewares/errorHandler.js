import ApiError from "../utils/ApiError.js";

const errorHandler = (
    error,
    req,
    res,
    next
) => {
    console.error(
        `[${req.method}] ${req.originalUrl}`,
        error
    );

    if (error.name === "ValidationError") {
        const details = Object.values(
            error.errors
        ).map((item) => item.message);

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            details
        });
    }

    if (
        error.code === 11000 &&
        error.keyPattern?.email
    ) {
        return res.status(409).json({
            success: false,
            message: "An account with this email already exists"
        });
    }

    const statusCode =
        error instanceof ApiError
            ? error.statusCode
            : 500;

    const response = {
        success: false,
        message:
            error instanceof ApiError
                ? error.message
                : "Internal server error"
    };

    if (
        error instanceof ApiError &&
        error.details
    ) {
        response.details = error.details;
    }

    if (process.env.NODE_ENV !== "production") {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

export default errorHandler;