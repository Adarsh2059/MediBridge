import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import api from "../../api/axios.js";

const ManageDoctors = () => {
    const [doctors, setDoctors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/doctors",
                    {
                        params: {
                            page: 1,
                            limit: 50
                        }
                    }
                );

            const data =
                response.data?.data ||
                response.data;

            setDoctors(
                data.doctors || []
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load doctors"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const toggleStatus = async (
        doctor
    ) => {
        const doctorId =
            doctor.id ||
            doctor._id;

        try {
            setError("");

            await api.patch(
                `/doctors/${doctorId}/status`,
                {
                    isActive:
                        !doctor.isActive
                }
            );

            await fetchDoctors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to update doctor status"
            );
        }
    };

    const deleteDoctor = async (
        doctor
    ) => {
        const doctorId =
            doctor.id ||
            doctor._id;

        const confirmed =
            window.confirm(
                `Delete ${doctor.name}? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `/doctors/${doctorId}`
            );

            await fetchDoctors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete doctor"
            );
        }
    };

    return (
        <main className="dashboard admin-page">
            <section className="dashboard-hero admin-hero">
                <span className="eyebrow">
                    Administration
                </span>

                <div className="admin-title-row">
                    <div>
                        <h1>
                            Manage Doctors
                        </h1>

                        <p>
                            Manage MediBridge
                            healthcare providers.
                        </p>
                    </div>

                    <Link
                        to="/admin/doctors/create"
                        className="primary-btn"
                    >
                        + Register Doctor
                    </Link>
                </div>
            </section>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="page-loader">
                    Loading doctors...
                </div>
            ) : doctors.length === 0 ? (
                <div className="empty-state admin-empty">
                    <h2>
                        No doctors found
                    </h2>

                    <p>
                        Register your first
                        doctor to get started.
                    </p>

                    <Link
                        to="/admin/doctors/create"
                        className="primary-btn"
                    >
                        Register Doctor
                    </Link>
                </div>
            ) : (
                <section className="admin-doctor-list">
                    {doctors.map(
                        (doctor) => {
                            const doctorId =
                                doctor.id ||
                                doctor._id;

                            const profile =
                                doctor.profile ||
                                {};

                            return (
                                <article
                                    className="admin-doctor-card"
                                    key={doctorId}
                                >
                                    <div className="admin-doctor-main">
                                        <div className="admin-doctor-avatar">
                                            {(
                                                doctor.name ||
                                                "D"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="admin-doctor-info">
                                            <span className="doctor-specialization">
                                                {profile.specialization ||
                                                    "General Physician"}
                                            </span>

                                            <h2>
                                                {doctor.name ||
                                                    "Doctor"}
                                            </h2>

                                            <p>
                                                {
                                                    doctor.email
                                                }
                                            </p>

                                            <p>
                                                {
                                                    profile.qualification
                                                }
                                            </p>

                                            <div className="admin-doctor-meta">
                                                <span>
                                                    {
                                                        profile.experience ??
                                                        0
                                                    }{" "}
                                                    years experience
                                                </span>

                                                <span>
                                                    ₹
                                                    {
                                                        profile.consultationFee ??
                                                        0
                                                    }
                                                </span>

                                                <span>
                                                    {
                                                        profile.slotDuration ??
                                                        30
                                                    }{" "}
                                                    min slots
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-doctor-actions">
                                        <span
                                            className={`status ${
                                                doctor.isActive
                                                    ? "status-active"
                                                    : "status-inactive"
                                            }`}
                                        >
                                            {doctor.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>

                                        <button
                                            type="button"
                                            className="secondary-btn"
                                            onClick={() =>
                                                toggleStatus(
                                                    doctor
                                                )
                                            }
                                        >
                                            {doctor.isActive
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>

                                        <button
                                            type="button"
                                            className="danger-btn"
                                            onClick={() =>
                                                deleteDoctor(
                                                    doctor
                                                )
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            );
                        }
                    )}
                </section>
            )}
        </main>
    );
};

export default ManageDoctors;