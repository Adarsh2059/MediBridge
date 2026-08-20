import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useParams
} from "react-router-dom";

import api from "../../api/axios.js";

const DoctorAppointmentDetails = () => {
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
                setLoading(true);
                setError("");

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

    const updateStatus = async (
    status
) => {
    try {
        setError("");

        await api.patch(
            `/appointments/${appointmentId}/status`,
            {
                status
            }
        );

        await fetchAppointment();
    } catch (error) {
        setError(
            error.response
                ?.data?.message ||
                "Unable to update appointment status"
        );
    }
};

    useEffect(() => {
    if (!appointmentId) {
        return;
    }

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

                <Link
                    to="/doctor"
                    className="secondary-btn"
                >
                    Back to Dashboard
                </Link>
            </main>
        );
    }

    if (!appointment) {
        return null;
    }

    const patient =
        appointment.patient;

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">
                    Consultation
                </span>

                <h1>
                    Patient Appointment
                </h1>

                <p>
                    Review patient
                    information and
                    pre-visit information
                    before the consultation.
                </p>
            </section>

            <section className="details-card">
                <div className="details-header">
                    <div>
                        <span className="eyebrow">
                            Patient
                        </span>

                        <h2>
                            {
                                patient?.name ||
                                "Patient"
                            }
                        </h2>

                        <p>
                            {
                                patient?.email ||
                                "Email unavailable"
                            }
                        </p>
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
                            Patient Phone
                        </span>

                        <strong>
                            {
                                patient?.phone ||
                                "Not provided"
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Appointment Status
                        </span>

                        <strong>
                            {
                                appointment.status
                            }
                        </strong>
                    </div>
                </div>

                <div className="details-section">
                    <h3>
                        Symptoms
                    </h3>

                    <p>
                        {
                            appointment.symptoms ||
                            "No symptoms provided."
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
            </section>

            {appointment.status === "booked" && (
    <div className="details-actions">
        <button
            type="button"
            className="primary-btn"
            onClick={() =>
                updateStatus(
                    "confirmed"
                )
            }
        >
            Confirm Appointment
        </button>
    </div>
)}

{appointment.status === "confirmed" && (
    <div className="details-actions">
        <button
            type="button"
            className="primary-btn"
            onClick={() =>
                updateStatus(
                    "completed"
                )
            }
        >
            Mark as Completed
        </button>
    </div>
)}

            <div className="details-actions">
                <Link
                    to="/doctor"
                    className="secondary-btn"
                >
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
};

export default DoctorAppointmentDetails;