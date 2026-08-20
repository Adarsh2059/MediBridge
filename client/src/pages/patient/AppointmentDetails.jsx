import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../../api/axios.js";

const AppointmentDetails = () => {
    const {
        appointmentId
    } = useParams();

    const navigate =
        useNavigate();

    const [
        appointment,
        setAppointment
    ] = useState(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        cancelling,
        setCancelling
    ] = useState(false);

    const [
        error,
        setError
    ] = useState("");

    const [
        cancelError,
        setCancelError
    ] = useState("");

    const [
        showCancelForm,
        setShowCancelForm
    ] = useState(false);

    const [
        cancellationReason,
        setCancellationReason
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

    useEffect(() => {
        if (!appointmentId) {
            return;
        }

        fetchAppointment();
    }, [
        appointmentId
    ]);

    const handleCancel =
        async (event) => {
            event.preventDefault();

            setCancelError("");

            if (
                !cancellationReason.trim()
            ) {
                setCancelError(
                    "Please provide a cancellation reason."
                );

                return;
            }

            const confirmed =
                window.confirm(
                    "Are you sure you want to cancel this appointment?"
                );

            if (!confirmed) {
                return;
            }

            try {
                setCancelling(true);

                const response =
                    await api.patch(
                        `/appointments/${appointmentId}/cancel`,
                        {
                            reason:
                                cancellationReason.trim()
                        }
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                const updatedAppointment =
                    data.appointment ||
                    data;

                setAppointment(
                    updatedAppointment
                );

                setShowCancelForm(
                    false
                );

                setCancellationReason("");

                /*
                 * Keep the user on the
                 * appointment details page
                 * so they can immediately
                 * see the cancelled status.
                 */
            } catch (error) {
                setCancelError(
                    error.response
                        ?.data
                        ?.message ||
                        "Unable to cancel appointment"
                );
            } finally {
                setCancelling(false);
            }
        };

    const canCancel =
        appointment &&
        (
            appointment.status ===
                "booked" ||
            appointment.status ===
                "confirmed"
        );

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
                    to="/patient/appointments"
                    className="secondary-btn"
                >
                    Back to Appointments
                </Link>
            </main>
        );
    }

    if (!appointment) {
        return (
            <main className="dashboard">
                <div className="empty-state">
                    <h2>
                        Appointment not found
                    </h2>

                    <Link
                        to="/patient/appointments"
                        className="primary-btn"
                    >
                        Back to Appointments
                    </Link>
                </div>
            </main>
        );
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

                <p>
                    View your consultation
                    details and manage your
                    appointment.
                </p>
            </section>

            <section className="details-card">
                <div className="details-header">
                    <div>
                        <span className="doctor-specialization">
                            {
                                appointment
                                    .doctor
                                    ?.specialization ||
                                "Medical Consultation"
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
                                appointment
                                    .doctor
                                    ?.qualification ||
                                ""
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
                            Consultation Fee
                        </span>

                        <strong>
                            ₹
                            {appointment
                                .doctor
                                ?.consultationFee ??
                                0}
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

                {cancelError && (
                    <div className="error-box">
                        {cancelError}
                    </div>
                )}

                {canCancel && (
                    <div className="details-section">
                        {!showCancelForm ? (
                            <button
                                type="button"
                                className="danger-btn"
                                onClick={() =>
                                    setShowCancelForm(
                                        true
                                    )
                                }
                            >
                                Cancel Appointment
                            </button>
                        ) : (
                            <form
                                onSubmit={
                                    handleCancel
                                }
                                className="cancel-form"
                            >
                                <h3>
                                    Cancel Appointment
                                </h3>

                                <p>
                                    Please provide
                                    a reason for
                                    cancelling
                                    this
                                    appointment.
                                </p>

                                <label>
                                    Cancellation
                                    Reason

                                    <textarea
                                        value={
                                            cancellationReason
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setCancellationReason(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter your reason..."
                                        rows={4}
                                        maxLength={
                                            500
                                        }
                                        required
                                    />
                                </label>

                                <div className="cancel-actions">
                                    <button
                                        type="submit"
                                        className="danger-btn"
                                        disabled={
                                            cancelling
                                        }
                                    >
                                        {cancelling
                                            ? "Cancelling..."
                                            : "Confirm Cancellation"}
                                    </button>

                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => {
                                            setShowCancelForm(
                                                false
                                            );

                                            setCancelError(
                                                ""
                                            );
                                        }}
                                        disabled={
                                            cancelling
                                        }
                                    >
                                        Keep Appointment
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {appointment.status ===
                    "cancelled" && (
                    <div className="success-box">
                        This appointment has
                        been cancelled.
                    </div>
                )}

                <div className="details-actions">
                    <Link
                        to="/patient/appointments"
                        className="secondary-btn"
                    >
                        Back to Appointments
                    </Link>

                    {appointment.status ===
                        "cancelled" && (
                        <Link
                            to="/patient/doctors"
                            className="primary-btn"
                        >
                            Book Another
                            Appointment
                        </Link>
                    )}
                </div>
            </section>
        </main>
    );
};

export default AppointmentDetails;