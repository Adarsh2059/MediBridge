import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useParams
} from "react-router-dom";

import api from "../../api/axios.js";

const AppointmentDetails = () => {
    const {
        appointmentId
    } = useParams();

    const [
        appointment,
        setAppointment
    ] = useState(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");

    const fetchAppointment =
        async () => {
            try {
                const response =
                    await api.get(
                        `/appointments/${appointmentId}`
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                setAppointment(
                    data.appointment ||
                        data
                );
            } catch (error) {
                setError(
                    error.response
                        ?.data
                        ?.message ||
                        "Unable to load appointment"
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchAppointment();
    }, [
        appointmentId
    ]);

    if (loading) {
        return (
            <div className="page-loader">
                Loading appointment...
            </div>
        );
    }

    if (error) {
        return (
            <main className="dashboard">
                <div className="error-box">
                    {error}
                </div>
            </main>
        );
    }

    if (!appointment) {
        return null;
    }

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">
                    Appointment
                </span>

                <h1>
                    Appointment Details
                </h1>
            </section>

            <section className="details-card">
                <div className="details-header">
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
                    </div>

                    <span
                        className={`status status-${appointment.status}`}
                    >
                        {
                            appointment.status
                        }
                    </span>
                </div>

                <div className="details-grid">
                    <div>
                        <span>
                            Date
                        </span>

                        <strong>
                            {
                                appointment.date
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Time
                        </span>

                        <strong>
                            {
                                appointment.startTime
                            }{" "}
                            -{" "}
                            {
                                appointment.endTime
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Calendar
                        </span>

                        <strong>
                            {appointment
                                .googleCalendarSyncStatus ||
                                "not_configured"}
                        </strong>
                    </div>
                </div>

                <div className="details-section">
                    <h3>
                        Symptoms
                    </h3>

                    <p>
                        {
                            appointment.symptoms
                        }
                    </p>
                </div>

                {appointment.bookingNotes && (
                    <div className="details-section">
                        <h3>
                            Booking Notes
                        </h3>

                        <p>
                            {
                                appointment.bookingNotes
                            }
                        </p>
                    </div>
                )}

                {appointment.cancellationReason && (
                    <div className="details-section">
                        <h3>
                            Cancellation Reason
                        </h3>

                        <p>
                            {
                                appointment.cancellationReason
                            }
                        </p>
                    </div>
                )}

                <Link
                    to="/patient/appointments"
                    className="secondary-btn"
                >
                    Back to Appointments
                </Link>
            </section>
        </main>
    );
};

export default AppointmentDetails;