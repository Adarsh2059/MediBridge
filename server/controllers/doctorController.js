import {
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    updateDoctorStatus,
    deleteDoctor
} from "../services/doctorService.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateCreateDoctorInput = ({
    name,
    email,
    password,
    specialization,
    qualification,
    experience,
    consultationFee
}) => {
    if (
        !name ||
        !email ||
        !password ||
        !specialization ||
        !qualification ||
        experience === undefined ||
        consultationFee === undefined
    ) {
        throw new ApiError(
            400,
            "Name, email, password, specialization, qualification, experience and consultation fee are required"
        );
    }

    if (password.length < 8) {
        throw new ApiError(
            400,
            "Password must contain at least 8 characters"
        );
    }

    if (Number(experience) < 0) {
        throw new ApiError(
            400,
            "Experience cannot be negative"
        );
    }

    if (Number(consultationFee) < 0) {
        throw new ApiError(
            400,
            "Consultation fee cannot be negative"
        );
    }
};

export const createDoctorController =
    asyncHandler(async (req, res) => {
        validateCreateDoctorInput(
            req.body
        );

        const doctor = await createDoctor(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Doctor created successfully",
            data: {
                doctor
            }
        });
    });

export const getDoctors =
    asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            specialization
        } = req.query;

        const result =
            await getAllDoctors({
                page,
                limit,
                specialization
            });

        res.status(200).json({
            success: true,
            message:
                "Doctors fetched successfully",
            data: result
        });
    });

export const getDoctor =
    asyncHandler(async (req, res) => {
        const doctor =
            await getDoctorById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Doctor fetched successfully",
            data: {
                doctor
            }
        });
    });

export const updateDoctorController =
    asyncHandler(async (req, res) => {
        if (
            Object.keys(req.body).length === 0
        ) {
            throw new ApiError(
                400,
                "At least one field is required for update"
            );
        }

        const doctor =
            await updateDoctor(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Doctor updated successfully",
            data: {
                doctor
            }
        });
    });

export const updateDoctorStatusController =
    asyncHandler(async (req, res) => {
        if (
            typeof req.body.isActive !==
            "boolean"
        ) {
            throw new ApiError(
                400,
                "isActive must be a boolean"
            );
        }

        const doctor =
            await updateDoctorStatus(
                req.params.id,
                req.body.isActive
            );

        res.status(200).json({
            success: true,
            message:
                "Doctor status updated successfully",
            data: {
                doctor
            }
        });
    });

export const deleteDoctorController =
    asyncHandler(async (req, res) => {
        await deleteDoctor(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Doctor deleted successfully"
        });
    });