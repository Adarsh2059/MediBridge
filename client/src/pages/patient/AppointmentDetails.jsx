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
        assessment,
        setAssessment
    ] = useState(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        assessmentLoading,
        setAssessmentLoading
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
        assessmentError,
        setAssessmentError
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

    const fetchAssessment =
        async () => {
            try {
                setAssessmentLoading(
                    true
                );

                setAssessmentError("");

                const response =
                    await api.get(
                        `/pre-visit/${appointmentId}`
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                setAssessment(
                    data.assessment ||
                        data ||
                        null
                );
            } catch (error) {
                /*
                 * A missing assessment should
                 * not make the appointment
                 * details page unusable.
                 *
                 * This can happen when:
                 *
                 * - AI is still processing
                 * - AI failed
                 * - assessment was not created
                 */
                const status =
                    error.response
                        ?.status;

                if (
                    status === 404
                ) {
                    setAssessment(
                        null
                    );
                } else {
                    setAssessmentError(
                        error.response
                            ?.data
                            ?.message ||
                            "Unable to load AI assessment"
                    );
                }
            } finally {
                setAssessmentLoading(
                    false
                );
            }
        };

    useEffect(() => {
        if (!appointmentId) {
            return;
        }

        fetchAppointment();
        fetchAssessment();
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

                setCancellationReason(
                    ""
                );
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

    const getUrgencyClass = (
        urgency
    ) => {
        if (
            urgency === "high"
        ) {
            return "ai-urgency-high";
        }

        if (
            urgency === "medium"
        ) {
            return "ai-urgency-medium";
        }

        return "ai-urgency-low";
    };

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
                    details, AI pre-visit
                    assessment and
                    appointment status.
                </p>
            </section>

            {/* -------------------------------- */}
            {/* APPOINTMENT INFORMATION          */}
            {/* -------------------------------- */}

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
                            {
                                appointment
                                    .doctor
                                    ?.user
                                    ?.name ||
                                "Doctor"
                            }
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

                {/* Symptoms */}

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

                {/* Booking Notes */}

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

                {/* Cancellation Reason */}

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
            </section>

            {/* -------------------------------- */}
            {/* AI PRE-VISIT ASSESSMENT          */}
            {/* -------------------------------- */}

            <section className="details-card ai-assessment-card">
                <div className="details-header">
                    <div>
                        <span className="eyebrow">
                            AI Assisted
                        </span>

                        <h2>
                            Pre-Visit Assessment
                        </h2>

                        <p>
                            AI-generated summary
                            based on the symptoms
                            you provided.
                        </p>
                    </div>

                    {assessment?.status && (
                        <span
                            className={`status status-${assessment.status}`}
                        >
                            {
                                assessment.status
                            }
                        </span>
                    )}
                </div>

                {assessmentLoading && (
                    <div className="page-loader">
                        Loading AI assessment...
                    </div>
                )}

                {!assessmentLoading &&
                    assessmentError && (
                        <div className="error-box">
                            {
                                assessmentError
                            }
                        </div>
                    )}

                {!assessmentLoading &&
                    !assessmentError &&
                    !assessment && (
                        <div className="empty-state">
                            <h3>
                                AI assessment
                                unavailable
                            </h3>

                            <p>
                                The AI pre-visit
                                assessment has
                                not been generated
                                yet.
                            </p>
                        </div>
                    )}

                {!assessmentLoading &&
                    assessment &&
                    assessment.status ===
                        "processing" && (
                        <div className="ai-processing">
                            <h3>
                                AI analysis in
                                progress
                            </h3>

                            <p>
                                Your symptoms
                                are being
                                analyzed. Please
                                refresh this page
                                shortly.
                            </p>
                        </div>
                    )}

                {!assessmentLoading &&
                    assessment &&
                    assessment.status ===
                        "failed" && (
                        <div className="error-box">
                            AI analysis could not
                            be completed. Your
                            appointment is still
                            confirmed.
                        </div>
                    )}

                {!assessmentLoading &&
                    assessment &&
                    assessment.status ===
                        "completed" && (
                        <>
                            <div className="ai-summary-grid">
                                <div className="ai-summary-item">
                                    <span>
                                        Urgency
                                    </span>

                                    <strong
                                        className={getUrgencyClass(
                                            assessment.urgency
                                        )}
                                    >
                                        {assessment
                                            .urgency
                                            ?.toUpperCase() ||
                                            "UNKNOWN"}
                                    </strong>
                                </div>

                                <div className="ai-summary-item">
                                    <span>
                                        Chief Complaint
                                    </span>

                                    <strong>
                                        {
                                            assessment.chiefComplaint ||
                                            "Not available"
                                        }
                                    </strong>
                                </div>
                            </div>

                            <div className="details-section">
                                <h3>
                                    Suggested Questions
                                </h3>

                                {assessment
                                    .suggestedQuestions
                                    ?.length >
                                0 ? (
                                    <ol className="ai-question-list">
                                        {assessment.suggestedQuestions.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <li
                                                    key={`${assessment._id}-${index}`}
                                                >
                                                    {
                                                        item.question
                                                    }
                                                </li>
                                            )
                                        )}
                                    </ol>
                                ) : (
                                    <p>
                                        No suggested
                                        questions
                                        available.
                                    </p>
                                )}
                            </div>

                            <div className="ai-disclaimer">
                                <strong>
                                    Important:
                                </strong>

                                <span>
                                    This AI-generated
                                    assessment is
                                    intended to help
                                    prepare for your
                                    consultation. It
                                    does not provide a
                                    medical diagnosis
                                    or replace advice
                                    from a qualified
                                    healthcare
                                    professional.
                                </span>
                            </div>
                        </>
                    )}
            </section>

            {/* -------------------------------- */}
            {/* CANCELLATION                     */}
            {/* -------------------------------- */}

            {cancelError && (
                <div className="error-box">
                    {cancelError}
                </div>
            )}

            {canCancel && (
                <section className="details-card">
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
                                Please provide a
                                reason for
                                cancelling this
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
                </section>
            )}

            {appointment.status ===
                "cancelled" && (
                <div className="success-box">
                    This appointment has
                    been cancelled.
                </div>
            )}

            {/* -------------------------------- */}
            {/* ACTIONS                          */}
            {/* -------------------------------- */}

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
        </main>
    );
};

export default AppointmentDetails;