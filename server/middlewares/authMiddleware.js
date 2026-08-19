import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            throw new ApiError(
                401,
                "Authentication required"
            );
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new ApiError(
                401,
                "Authentication token is missing"
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(
            decoded.userId
        );

        if (!user) {
            throw new ApiError(
                401,
                "User associated with this token no longer exists"
            );
        }

        if (!user.isActive) {
            throw new ApiError(
                403,
                "Your account has been deactivated"
            );
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return next(
                new ApiError(
                    401,
                    "Invalid authentication token"
                )
            );
        }

        if (error.name === "TokenExpiredError") {
            return next(
                new ApiError(
                    401,
                    "Authentication token has expired"
                )
            );
        }

        next(error);
    }
};

export default authenticate;