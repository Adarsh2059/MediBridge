import {
    registerUser,
    loginUser,
    getCurrentUser
} from "../services/authService.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateRegisterInput = ({
    name,
    email,
    password
}) => {
    if (!name || !email || !password) {
        throw new ApiError(
            400,
            "Name, email and password are required"
        );
    }

    if (password.length < 8) {
        throw new ApiError(
            400,
            "Password must contain at least 8 characters"
        );
    }
};

const validateLoginInput = ({
    email,
    password
}) => {
    if (!email || !password) {
        throw new ApiError(
            400,
            "Email and password are required"
        );
    }
};

export const register = asyncHandler(
    async (req, res) => {
        validateRegisterInput(req.body);

        const result = await registerUser(req.body);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: result
        });
    }
);

export const login = asyncHandler(
    async (req, res) => {
        validateLoginInput(req.body);

        const result = await loginUser(req.body);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    }
);

export const getMe = asyncHandler(
    async (req, res) => {
        const user = await getCurrentUser(
            req.user.id
        );

        res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: {
                user
            }
        });
    }
);