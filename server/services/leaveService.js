import DoctorProfile from "../models/DoctorProfile.js";
import DoctorLeave from "../models/DoctorLeave.js";
import ApiError from "../utils/ApiError.js";
import {
    isValidDateString
} from "../utils/dateUtils.js";

const ensureDoctorExists = async (
    doctorId
) => {
    const doctor =
        await DoctorProfile.findById(
            doctorId
        );

    if (!doctor) {
        throw new ApiError(
            404,
            "Doctor not found"
        );
    }

    return doctor;
};

export const createDoctorLeave = async (
    doctorId,
    { date, reason = "" }
) => {
    if (!isValidDateString(date)) {
        throw new ApiError(
            400,
            "Invalid date. Expected YYYY-MM-DD"
        );
    }

    await ensureDoctorExists(
        doctorId
    );

    const existingLeave =
        await DoctorLeave.findOne({
            doctor: doctorId,
            date
        });

    if (existingLeave) {
        throw new ApiError(
            409,
            "Doctor already has leave on this date"
        );
    }

    const leave =
        await DoctorLeave.create({
            doctor: doctorId,
            date,
            reason
        });

    return leave;
};

export const getDoctorLeaves = async (
    doctorId,
    { from, to } = {}
) => {
    await ensureDoctorExists(
        doctorId
    );

    const filter = {
        doctor: doctorId
    };

    if (from || to) {
        filter.date = {};

        if (from) {
            if (!isValidDateString(from)) {
                throw new ApiError(
                    400,
                    "Invalid 'from' date"
                );
            }

            filter.date.$gte = from;
        }

        if (to) {
            if (!isValidDateString(to)) {
                throw new ApiError(
                    400,
                    "Invalid 'to' date"
                );
            }

            filter.date.$lte = to;
        }
    }

    return DoctorLeave.find(filter)
        .sort({
            date: 1
        })
        .lean();
};

export const deleteDoctorLeave = async (
    doctorId,
    leaveId
) => {
    await ensureDoctorExists(
        doctorId
    );

    const leave =
        await DoctorLeave.findOne({
            _id: leaveId,
            doctor: doctorId
        });

    if (!leave) {
        throw new ApiError(
            404,
            "Leave record not found"
        );
    }

    await DoctorLeave.findByIdAndDelete(
        leaveId
    );

    return leave;
};