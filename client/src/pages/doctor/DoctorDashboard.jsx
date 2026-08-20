import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import {
    useAuth
} from "../../context/AuthContext.jsx";

import api from "../../api/axios.js";

const DoctorDashboard = () => {
    const {
        user
    } = useAuth();

    const [
        appointments,
        setAppointments
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");

    const fetchAppointments =
        async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        "/appointments",
                        {
                            params: {
                                page: 1,
                                limit: 50
                            }
                        }
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                setAppointments(
                    data.appointments ||
                        data ||
                        []
                );
            } catch (error) {
                setError(
                    error.response
                        ?.data
                        ?.message ||
                        "Unable to load appointments"
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchAppointments();
    }, []);

    /*
     * The backend stores appointment
     * dates as YYYY-MM-DD strings.
     *
     * Using local date formatting here
     * avoids UTC-related date shifts.
     */
    const todayString =
        useMemo(() => {
            const today =
                new Date();

            const year =
                today.getFullYear();

            const month =
                String(
                    today.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    today.getDate()
                ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        }, []);

    const todayAppointments =
        useMemo(() => {
            return appointments
                .filter(
                    (appointment) =>
                        appointment.date ===
                        todayString
                )
                .sort(
                    (a, b) =>
                        a.startTime.localeCompare(
                            b.startTime
                        )
                );
        }, [
            appointments,
            todayString
        ]);

    const upcomingAppointments =
        useMemo(() => {
            return appointments
                .filter(
                    (appointment) =>
                        appointment.date >
                            todayString &&
                        appointment.status !==
                            "cancelled"
                )
                .sort(
                    (a, b) => {
                        const first =
                            `${a.date} ${a.startTime}`;

                        const second =
                            `${b.date} ${b.startTime}`;

                        return first.localeCompare(
                            second
                        );
                    }
                )
                .slice(0, 10);
        }, [
            appointments,
            todayString
        ]);

    const activeAppointments =
        useMemo(() => {
            return appointments.filter(
                (appointment) =>
                    appointment.status ===
                        "booked" ||
                    appointment.status ===
                        "confirmed"
            ).length;
        }, [
            appointments
        ]);

    const getPatientName = (
        appointment
    ) => {
        return (
            appointment.patient?.name ||
            "Patient"
        );
    };

    const getStatusClass = (
        status
    ) => {
        return `status status-${status}`;
    };

    const renderAppointmentCard = (
        appointment
    ) => {
        return (
            <article
                className="doctor-appointment-card"
                key={
                    appointment._id
                }
            >
                <div className="doctor-appointment-main">
                    <div className="patient-avatar">
                        {getPatientName(
                            appointment
                        )
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <span className="eyebrow">
                            Patient
                        </span>

                        <h3>
                            {getPatientName(
                                appointment
                            )}
                        </h3>

                        <p>
                            {
                                appointment.date
                            }{" "}
                            ·{" "}
                            {
                                appointment.startTime
                            }{" "}
                            -{" "}
                            {
                                appointment.endTime
                            }
                        </p>
                    </div>
                </div>

                <div className="doctor-appointment-info">
                    <span
                        className={getStatusClass(
                            appointment.status
                        )}
                    >
                        {
                            appointment.status
                        }
                    </span>

                    <p>
                        <strong>
                            Symptoms:
                        </strong>{" "}
                        {appointment.symptoms ||
                            "Not provided"}
                    </p>

                    <Link
                        to={`/doctor/appointments/${appointment._id}`}
                        className="primary-btn"
                    >
                        View Details
                    </Link>
                </div>
            </article>
        );
    };

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <div>
                    <span className="eyebrow">
                        Doctor Portal
                    </span>

                    <h1>
                        Welcome, Dr.{" "}
                        {user?.name ||
                            "Doctor"}
                    </h1>

                    <p>
                        Manage today's
                        consultations and
                        review upcoming
                        patients.
                    </p>
                </div>
            </section>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            <section className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-icon">
                        ◷
                    </div>

                    <h2>
                        Today's
                        Appointments
                    </h2>

                    <strong className="dashboard-stat">
                        {
                            todayAppointments.length
                        }
                    </strong>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        ✓
                    </div>

                    <h2>
                        Active
                        Appointments
                    </h2>

                    <strong className="dashboard-stat">
                        {
                            activeAppointments
                        }
                    </strong>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        →
                    </div>

                    <h2>
                        Upcoming
                    </h2>

                    <strong className="dashboard-stat">
                        {
                            upcomingAppointments.length
                        }
                    </strong>
                </div>
            </section>

            {loading ? (
                <div className="page-loader">
                    Loading your
                    appointments...
                </div>
            ) : (
                <>
                    <section className="dashboard-section">
                        <div className="section-heading">
                            <div>
                                <span className="eyebrow">
                                    Today
                                </span>

                                <h2>
                                    Today's
                                    Appointments
                                </h2>
                            </div>
                        </div>

                        {todayAppointments.length ===
                        0 ? (
                            <div className="empty-state">
                                <h3>
                                    No appointments
                                    today
                                </h3>

                                <p>
                                    You currently
                                    have no
                                    appointments
                                    scheduled for
                                    today.
                                </p>
                            </div>
                        ) : (
                            <div className="doctor-appointment-list">
                                {todayAppointments.map(
                                    renderAppointmentCard
                                )}
                            </div>
                        )}
                    </section>

                    <section className="dashboard-section">
                        <div className="section-heading">
                            <div>
                                <span className="eyebrow">
                                    Schedule
                                </span>

                                <h2>
                                    Upcoming
                                    Appointments
                                </h2>
                            </div>
                        </div>

                        {upcomingAppointments.length ===
                        0 ? (
                            <div className="empty-state">
                                <h3>
                                    No upcoming
                                    appointments
                                </h3>

                                <p>
                                    Your upcoming
                                    schedule is
                                    currently
                                    empty.
                                </p>
                            </div>
                        ) : (
                            <div className="doctor-appointment-list">
                                {upcomingAppointments.map(
                                    renderAppointmentCard
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </main>
    );
};

export default DoctorDashboard;