import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import api from "../../api/axios.js";

const MyAppointments = () => {
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
                const response =
                    await api.get(
                        "/appointments"
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

    if (loading) {
        return (
            <div className="page-loader">
                Loading appointments...
            </div>
        );
    }

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">
                    Patient Portal
                </span>

                <h1>
                    My Appointments
                </h1>

                <p>
                    Track your upcoming and
                    previous consultations.
                </p>
            </section>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            {appointments.length ===
            0 ? (
                <div className="empty-state">
                    <h2>
                        No appointments yet
                    </h2>

                    <p>
                        Book your first
                        consultation with a
                        doctor.
                    </p>

                    <Link
                        to="/patient/doctors"
                        className="primary-btn"
                    >
                        Find a Doctor
                    </Link>
                </div>
            ) : (
                <section className="appointment-list">
                    {appointments.map(
                        (
                            appointment
                        ) => (
                            <article
                                className="appointment-card"
                                key={
                                    appointment._id
                                }
                            >
                                <div>
                                    <span className="doctor-specialization">
                                        {
                                            appointment
                                                .doctor
                                                ?.specialization
                                        }
                                    </span>

                                    <h2>
                                        Dr.{" "}
                                        {appointment
                                            .doctor
                                            ?.user
                                            ?.name ||
                                            "Doctor"}
                                    </h2>

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

                                <div className="appointment-side">
                                    <span
                                        className={`status status-${appointment.status}`}
                                    >
                                        {
                                            appointment.status
                                        }
                                    </span>

                                    <Link
                                        to={`/patient/appointments/${appointment._id}`}
                                    >
                                        View
                                    </Link>
                                </div>
                            </article>
                        )
                    )}
                </section>
            )}
        </main>
    );
};

export default MyAppointments;