import bcrypt from "bcryptjs";

import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";

import ApiError from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";

const DEFAULT_WORKING_HOURS = {
    monday: {
        enabled: true,
        start: "09:00",
        end: "17:00"
    },

    tuesday: {
        enabled: true,
        start: "09:00",
        end: "17:00"
    },

    wednesday: {
        enabled: true,
        start: "09:00",
        end: "17:00"
    },

    thursday: {
        enabled: true,
        start: "09:00",
        end: "17:00"
    },

    friday: {
        enabled: true,
        start: "09:00",
        end: "17:00"
    },

    saturday: {
        enabled: false,
        start: null,
        end: null
    },

    sunday: {
        enabled: false,
        start: null,
        end: null
    }
};

const sanitizeDoctor = (doctor) => {
    return {
        id: doctor.user?._id || doctor.user,
        name: doctor.user?.name,
        email: doctor.user?.email,
        phone: doctor.user?.phone,
        isActive: doctor.user?.isActive,

        profile: {
            id: doctor._id,
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            experience: doctor.experience,
            consultationFee: doctor.consultationFee,
            bio: doctor.bio,
            slotDuration: doctor.slotDuration,
            workingHours: doctor.workingHours
        },

        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
    };
};

export const createDoctor = async ({
    name,
    email,
    password,
    phone,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio = "",
    slotDuration = 30,
    workingHours = DEFAULT_WORKING_HOURS
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

    const hashedPassword = await bcrypt.hash(
        password,
        12
    );

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim(),
        role: ROLES.DOCTOR
    });

    try {
        const doctorProfile = await DoctorProfile.create({
            user: user._id,
            specialization,
            qualification,
            experience,
            consultationFee,
            bio,
            slotDuration,
            workingHours
        });

        const populatedDoctor =
            await DoctorProfile.findById(
                doctorProfile._id
            ).populate({
                path: "user",
                select: "name email phone role isActive"
            });

        return sanitizeDoctor(populatedDoctor);
    } catch (error) {
        await User.findByIdAndDelete(user._id);

        throw error;
    }
};

export const getAllDoctors = async ({
    page = 1,
    limit = 10,
    specialization
}) => {
    const currentPage = Math.max(
        Number(page) || 1,
        1
    );

    const pageLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const skip =
        (currentPage - 1) * pageLimit;

    const userFilter = {
        role: ROLES.DOCTOR
    };

    const profileFilter = {};

    if (specialization) {
        profileFilter.specialization = {
            $regex: specialization.trim(),
            $options: "i"
        };
    }

    const doctors = await DoctorProfile.find(
        profileFilter
    )
        .populate({
            path: "user",
            match: userFilter,
            select: "name email phone role isActive"
        })
        .sort({
            createdAt: -1
        })
        .skip(skip)
        .limit(pageLimit)
        .lean();

    const filteredDoctors = doctors.filter(
        (doctor) => doctor.user
    );

    const total = await DoctorProfile.countDocuments(
        profileFilter
    );

    return {
        doctors: filteredDoctors.map(sanitizeDoctor),

        pagination: {
            page: currentPage,
            limit: pageLimit,
            total,
            totalPages: Math.ceil(
                total / pageLimit
            )
        }
    };
};

export const getDoctorById = async (
    doctorId
) => {
    const doctor = await DoctorProfile.findById(
        doctorId
    ).populate({
        path: "user",
        select: "name email phone role isActive"
    });

    if (!doctor || !doctor.user) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    if (doctor.user.role !== ROLES.DOCTOR) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    return sanitizeDoctor(doctor);
};

export const updateDoctor = async (
    doctorId,
    updates
) => {
    const doctor = await DoctorProfile.findById(
        doctorId
    ).populate({
        path: "user",
        select: "name email phone role isActive"
    });

    if (!doctor || !doctor.user) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    const allowedProfileFields = [
        "specialization",
        "qualification",
        "experience",
        "consultationFee",
        "bio",
        "slotDuration",
        "workingHours"
    ];

    for (const field of allowedProfileFields) {
        if (
            updates[field] !== undefined
        ) {
            doctor[field] = updates[field];
        }
    }

    if (updates.name !== undefined) {
        doctor.user.name =
            updates.name.trim();
    }

    if (updates.phone !== undefined) {
        doctor.user.phone =
            updates.phone.trim();
    }

    if (updates.email !== undefined) {
        const normalizedEmail =
            updates.email.toLowerCase().trim();

        const emailOwner =
            await User.findOne({
                email: normalizedEmail,
                _id: {
                    $ne: doctor.user._id
                }
            });

        if (emailOwner) {
            throw new ApiError(
                409,
                "An account with this email already exists"
            );
        }

        doctor.user.email =
            normalizedEmail;
    }

    await doctor.user.save();
    await doctor.save();

    const updatedDoctor =
        await DoctorProfile.findById(
            doctor._id
        ).populate({
            path: "user",
            select: "name email phone role isActive"
        });

    return sanitizeDoctor(updatedDoctor);
};

export const updateDoctorStatus = async (
    doctorId,
    isActive
) => {
    const doctor = await DoctorProfile.findById(
        doctorId
    );

    if (!doctor) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    const user = await User.findById(
        doctor.user
    );

    if (!user || user.role !== ROLES.DOCTOR) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    user.isActive = Boolean(isActive);

    await user.save();

    const updatedDoctor =
        await DoctorProfile.findById(
            doctorId
        ).populate({
            path: "user",
            select: "name email phone role isActive"
        });

    return sanitizeDoctor(updatedDoctor);
};

export const deleteDoctor = async (
    doctorId
) => {
    const doctor = await DoctorProfile.findById(
        doctorId
    );

    if (!doctor) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    await DoctorProfile.findByIdAndDelete(
        doctorId
    );

    await User.findByIdAndDelete(
        doctor.user
    );
};