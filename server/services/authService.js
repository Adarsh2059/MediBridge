import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const sanitizeUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt
    };
};

export const registerUser = async ({
    name,
    email,
    password,
    phone,
    role
}) => {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new ApiError(
            409,
            "An account with this email already exists"
        );
    }

    /*
     * Security rule:
     * Public registration can create patient accounts only.
     *
     * Doctor and admin accounts will be created through
     * controlled administrative workflows later.
     */
    const assignedRole = ROLES.PATIENT;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim(),
        role: assignedRole
    });

    const token = generateToken(user._id.toString());

    return {
        user: sanitizeUser(user),
        token
    };
};

export const loginUser = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
        email: normalizedEmail
    }).select("+password");

    if (!user) {
        throw new ApiError(
            401,
            "Invalid email or password"
        );
    }

    if (!user.isActive) {
        throw new ApiError(
            403,
            "Your account has been deactivated"
        );
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatches) {
        throw new ApiError(
            401,
            "Invalid email or password"
        );
    }

    const token = generateToken(user._id.toString());

    return {
        user: sanitizeUser(user),
        token
    };
};

export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    if (!user.isActive) {
        throw new ApiError(
            403,
            "Your account has been deactivated"
        );
    }

    return sanitizeUser(user);
};