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
    const { appointmentId } = useParams();

    const [appointment, setAppointment] = useState(null);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assessmentLoading, setAssessmentLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState("");
    const [assessmentError, setAssessmentError] = useState("");
    const [cancelError, setCancelError] = useState("");
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");

    // Consultation and rescheduling states
    const [consultation, setConsultation] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleSlots, setRescheduleSlots] = useState([]);
    const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
    const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState("");
    const [rescheduleSuccess, setRescheduleSuccess] = useState("");
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);

    const fetchAppointment = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/appointments/${appointmentId}`);
            const data = response.data?.data || response.data;
            setAppointment(data.appointment || data);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load appointment"
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessment = async () => {
        try {
            setAssessmentLoading(true);
            setAssessmentError("");

            const response = await api.get(`/pre-visit/${appointmentId}`);
            const data = response.data?.data || response.data;
            setAssessment(data.assessment || data || null);
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) {
                setAssessment(null);
            } else {
                setAssessmentError(
                    error.response?.data?.message ||
                    "Unable to load AI assessment"
                );
            }
        } finally {
            setAssessmentLoading(false);
        }
    };

    useEffect(() => {
        if (!appointmentId) {
            return;
        }

        fetchAppointment();
        fetchAssessment();
    }, [appointmentId]);

    // Load consultation details if completed
    useEffect(() => {
        if (!appointmentId || !appointment) return;

        if (appointment.status === "completed") {
            const loadConsultation = async () => {
                try {
                    const res = await api.get(`/consultations/appointment/${appointmentId}`);
                    const data = res.data?.data?.consultation || res.data?.consultation;
                    if (data) {
                        setConsultation(data);
                    }
                } catch (err) {
                    console.log("No consultation found or failed to load");
                }
            };
            loadConsultation();
        }
    }, [appointmentId, appointment]);

    // Poll AI summary generation if processing
    useEffect(() => {
        if (!consultation || (consultation.aiStatus !== "processing" && consultation.aiStatus !== "pending")) {
            return;
        }
        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/consultations/appointment/${appointmentId}`);
                const data = response.data?.data?.consultation || response.data?.consultation;
                if (data) {
                    setConsultation(data);
                    if (data.aiStatus !== "processing" && data.aiStatus !== "pending") {
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error("Error polling consultation summary:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [consultation?.aiStatus, appointmentId]);

    // Fetch availability slots for rescheduling
    useEffect(() => {
        if (!rescheduleDate || !appointment?.doctor?._id) {
            setRescheduleSlots([]);
            return;
        }

        const fetchRescheduleAvailability = async () => {
            setLoadingRescheduleSlots(true);
            setRescheduleError("");
            setSelectedRescheduleSlot(null);

            try {
                const response = await api.get(`/doctors/${appointment.doctor._id}/availability`, {
                    params: { date: rescheduleDate }
                });
                const availabilityData = response.data?.data?.availability || response.data?.availability || response.data;
                setRescheduleSlots(availabilityData.slots || []);
            } catch (error) {
                console.error("Failed to fetch reschedule slots:", error);
                setRescheduleError("Unable to load availability slots");
            } finally {
                setLoadingRescheduleSlots(false);
            }
        };

        fetchRescheduleAvailability();
    }, [rescheduleDate, appointment?.doctor?._id]);

    const handleCancel = async (event) => {
        event.preventDefault();
        setCancelError("");

        if (!cancellationReason.trim()) {
            setCancelError("Please provide a cancellation reason.");
            return;
        }

        const confirmed = window.confirm("Are you sure you want to cancel this appointment?");
        if (!confirmed) {
            return;
        }

        try {
            setCancelling(true);
            const response = await api.patch(`/appointments/${appointmentId}/cancel`, {
                reason: cancellationReason.trim()
            });

            const data = response.data?.data || response.data;
            setAppointment(data.appointment || data);
            setShowCancelForm(false);
            setCancellationReason("");
        } catch (error) {
            setCancelError(
                error.response?.data?.message ||
                "Unable to cancel appointment"
            );
        } finally {
            setCancelling(false);
        }
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        if (!selectedRescheduleSlot) {
            setRescheduleError("Please select a time slot");
            return;
        }

        try {
            setRescheduling(true);
            setRescheduleError("");
            setRescheduleSuccess("");

            await api.patch(`/appointments/${appointmentId}/reschedule`, {
                newDate: rescheduleDate,
                newStartTime: selectedRescheduleSlot.start,
                newEndTime: selectedRescheduleSlot.end
            });

            setRescheduleSuccess("Appointment rescheduled successfully!");
            setShowRescheduleForm(false);
            setRescheduleDate("");
            setSelectedRescheduleSlot(null);
            await fetchAppointment();
        } catch (error) {
            setRescheduleError(
                error.response?.data?.message ||
                "Failed to reschedule appointment"
            );
        } finally {
            setRescheduling(false);
        }
    };

    const canCancel = appointment && (appointment.status === "booked" || appointment.status === "confirmed");
    const canReschedule = appointment && (appointment.status === "booked" || appointment.status === "confirmed");

    const getUrgencyClass = (urgency) => {
        if (urgency === "high") return "ai-urgency-high";
        if (urgency === "medium") return "ai-urgency-medium";
        return "ai-urgency-low";
    };

    if (loading) {
        return (
            <div className="page-loader">
                Loading appointment...
            </div>
        );
    }

    if (error && !appointment) {
        return (
            <main className="dashboard">
                <div className="error-box">
                    {error}
                </div>
                <Link to="/patient/appointments" className="secondary-btn">
                    Back to Appointments
                </Link>
            </main>
        );
    }

    if (!appointment) {
        return (
            <main className="dashboard">
                <div className="empty-state">
                    <h2>Appointment not found</h2>
                    <Link to="/patient/appointments" className="primary-btn">
                        Back to Appointments
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">Appointment</span>
                <h1>Appointment Details</h1>
                <p>View your consultation details, AI pre-visit assessment and appointment status.</p>
            </section>

            {rescheduleSuccess && <div className="success-box" style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981" }}>{rescheduleSuccess}</div>}

            {/* Appointment Information Card */}
            <section className="details-card">
                <div className="details-header">
                    <div>
                        <span className="doctor-specialization">
                            {appointment.doctor?.specialization || "Medical Consultation"}
                        </span>
                        <h2>Dr. {appointment.doctor?.user?.name || "Doctor"}</h2>
                        <p>{appointment.doctor?.qualification || ""}</p>
                    </div>
                    <span className={`status status-${appointment.status}`}>
                        {appointment.status}
                    </span>
                </div>

                <div className="details-grid">
                    <div>
                        <span>Date</span>
                        <strong>{appointment.date}</strong>
                    </div>
                    <div>
                        <span>Time</span>
                        <strong>{appointment.startTime} - {appointment.endTime}</strong>
                    </div>
                    <div>
                        <span>Consultation Fee</span>
                        <strong>₹{appointment.doctor?.consultationFee ?? 0}</strong>
                    </div>
                    <div>
                        <span>Calendar</span>
                        <strong>{appointment.googleCalendarSyncStatus || "not_configured"}</strong>
                    </div>
                </div>

                <div className="details-section">
                    <h3>Symptoms</h3>
                    <p>{appointment.symptoms || "No symptoms provided."}</p>
                </div>

                {appointment.bookingNotes && (
                    <div className="details-section">
                        <h3>Booking Notes</h3>
                        <p>{appointment.bookingNotes}</p>
                    </div>
                )}

                {appointment.cancellationReason && (
                    <div className="details-section">
                        <h3>Cancellation Reason</h3>
                        <p>{appointment.cancellationReason}</p>
                    </div>
                )}
            </section>

            {/* Post-Visit Consultation Section */}
            {appointment.status === "completed" && consultation && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">Consultation Details</span>
                            <h2>Diagnosis: {consultation.diagnosis || "No specific diagnosis recorded"}</h2>
                        </div>
                    </div>

                    <div className="details-section" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
                        <h3>Doctor's Notes</h3>
                        <p style={{ whiteSpace: "pre-wrap" }}>{consultation.clinicalNotes}</p>
                    </div>

                    <div className="details-section">
                        <h3>Prescribed Medication</h3>
                        {consultation.prescription?.length === 0 ? (
                            <p>No medication prescribed.</p>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", margin: "1rem 0" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                                        <th style={{ padding: "0.5rem" }}>Medicine</th>
                                        <th style={{ padding: "0.5rem" }}>Dosage</th>
                                        <th style={{ padding: "0.5rem" }}>Frequency</th>
                                        <th style={{ padding: "0.5rem" }}>Duration</th>
                                        <th style={{ padding: "0.5rem" }}>Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultation.prescription.map((m, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "0.5rem" }}><strong>{m.medicine}</strong></td>
                                            <td style={{ padding: "0.5rem" }}>{m.dosage}</td>
                                            <td style={{ padding: "0.5rem" }}>{m.frequency}</td>
                                            <td style={{ padding: "0.5rem" }}>{m.duration}</td>
                                            <td style={{ padding: "0.5rem" }}>{m.instructions || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {consultation.followUpInstructions && (
                        <div className="details-section">
                            <h3>Follow-up Instructions</h3>
                            <p style={{ whiteSpace: "pre-wrap" }}>{consultation.followUpInstructions}</p>
                        </div>
                    )}

                    {/* AI Summary Block */}
                    <div style={{ marginTop: "2.5rem", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "1.5rem" }}>
                        <h3>AI Patient-Friendly Summary</h3>
                        {consultation.aiStatus === "processing" && (
                            <div className="ai-processing" style={{ padding: "1rem", backgroundColor: "rgba(245,158,11,0.05)", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                                <p style={{ fontStyle: "italic", margin: 0 }}>
                                    ⏳ Your patient-friendly summary is being prepared.
                                </p>
                            </div>
                        )}
                        {consultation.aiStatus === "failed" && (
                            <div className="error-box" style={{ padding: "1rem", backgroundColor: "rgba(239,68,68,0.05)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                                <p style={{ margin: 0 }}>
                                    ⚠️ Your consultation is available, but the AI summary is temporarily unavailable.
                                </p>
                            </div>
                        )}
                        {consultation.aiStatus === "completed" && consultation.aiSummary && (
                            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p style={{ whiteSpace: "pre-wrap", marginBottom: "1rem", lineHeight: "1.6" }}>{consultation.aiSummary.summary}</p>
                                
                                {consultation.aiSummary.medicationSchedule?.length > 0 && (
                                    <div style={{ marginTop: "1rem" }}>
                                        <h4 style={{ margin: "0.5rem 0", color: "#10b981" }}>Your Medication Schedule</h4>
                                        <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }}>
                                            {consultation.aiSummary.medicationSchedule.map((sched, idx) => (
                                                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                                                    <strong>{sched.medicine}</strong>: {sched.instructions}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {consultation.aiSummary.followUpSteps?.length > 0 && (
                                    <div style={{ marginTop: "1rem" }}>
                                        <h4 style={{ margin: "0.5rem 0", color: "#10b981" }}>Steps for Recovery</h4>
                                        <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }}>
                                            {consultation.aiSummary.followUpSteps.map((step, idx) => (
                                                <li key={idx} style={{ marginBottom: "0.4rem" }}>{step}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* AI Pre-Visit Assessment Card */}
            {assessment && (
                <section className="details-card ai-assessment-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">AI Assisted</span>
                            <h2>Pre-Visit Assessment</h2>
                            <p>AI-generated summary based on the symptoms you provided.</p>
                        </div>
                        <span className={`status status-${assessment.status}`}>
                            {assessment.status}
                        </span>
                    </div>

                    {assessmentLoading && (
                        <div className="page-loader">
                            Loading AI assessment...
                        </div>
                    )}

                    {!assessmentLoading && assessmentError && (
                        <div className="error-box">
                            {assessmentError}
                        </div>
                    )}

                    {!assessmentLoading && !assessmentError && assessment.status === "processing" && (
                        <div className="ai-processing">
                            <h3>AI analysis in progress</h3>
                            <p>Your symptoms are being analyzed. Please refresh this page shortly.</p>
                        </div>
                    )}

                    {!assessmentLoading && !assessmentError && assessment.status === "failed" && (
                        <div className="error-box">
                            AI analysis could not be completed. Your appointment is still confirmed.
                        </div>
                    )}

                    {!assessmentLoading && !assessmentError && assessment.status === "completed" && (
                        <>
                            <div className="ai-summary-grid">
                                <div className="ai-summary-item">
                                    <span>Urgency</span>
                                    <strong className={getUrgencyClass(assessment.urgency)}>
                                        {assessment.urgency?.toUpperCase() || "UNKNOWN"}
                                    </strong>
                                </div>
                                <div className="ai-summary-item">
                                    <span>Chief Complaint</span>
                                    <strong>{assessment.chiefComplaint || "Not available"}</strong>
                                </div>
                            </div>

                            <div className="details-section">
                                <h3>Suggested Questions</h3>
                                {assessment.suggestedQuestions?.length > 0 ? (
                                    <ol className="ai-question-list">
                                        {assessment.suggestedQuestions.map((item, index) => (
                                            <li key={`${assessment._id}-${index}`}>{item.question}</li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p>No suggested questions available.</p>
                                )}
                            </div>

                            <div className="ai-disclaimer">
                                <strong>Important:</strong>
                                <span>This AI-generated assessment is intended to help prepare for your consultation. It does not provide a medical diagnosis or replace advice from a qualified healthcare professional.</span>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Rescheduling Form Section */}
            {canReschedule && showRescheduleForm && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">Reschedule Appointment</span>
                            <h2>Select New Date & Time</h2>
                        </div>
                    </div>

                    {rescheduleError && <div className="error-box" style={{ margin: "1rem 0" }}>{rescheduleError}</div>}

                    <form onSubmit={handleReschedule} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontWeight: "bold" }}>Date</label>
                            <input
                                type="date"
                                value={rescheduleDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                required
                                style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff" }}
                            />
                        </div>

                        {rescheduleDate && (
                            <div className="details-section">
                                <h3>Available Slots</h3>
                                {loadingRescheduleSlots ? (
                                    <p>Loading available slots...</p>
                                ) : rescheduleSlots.length === 0 ? (
                                    <p>No available slots found for this date. Please select another date.</p>
                                ) : (
                                    <div className="slots-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.8rem", marginTop: "1rem" }}>
                                        {rescheduleSlots.map((slot, idx) => {
                                            const isSelected = selectedRescheduleSlot?.start === slot.start && selectedRescheduleSlot?.end === slot.end;
                                            const isAvailable = slot.status === "available";
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={!isAvailable}
                                                    onClick={() => setSelectedRescheduleSlot(slot)}
                                                    style={{
                                                        padding: "0.8rem",
                                                        borderRadius: "8px",
                                                        border: isSelected ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
                                                        backgroundColor: isSelected ? "rgba(16, 185, 129, 0.2)" : isAvailable ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.05)",
                                                        color: isSelected ? "#10b981" : isAvailable ? "#fff" : "rgba(255,255,255,0.2)",
                                                        cursor: isAvailable ? "pointer" : "not-allowed",
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    <div>{slot.start}</div>
                                                    <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{slot.status}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="cancel-actions" style={{ display: "flex", gap: "1rem" }}>
                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={rescheduling || !selectedRescheduleSlot}
                            >
                                {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                            </button>
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => {
                                    setShowRescheduleForm(false);
                                    setRescheduleDate("");
                                    setSelectedRescheduleSlot(null);
                                    setRescheduleError("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Cancel Appointment Section */}
            {cancelError && (
                <div className="error-box" style={{ marginTop: "2rem" }}>
                    {cancelError}
                </div>
            )}

            {canCancel && !showRescheduleForm && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    {!showCancelForm ? (
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => setShowRescheduleForm(true)}
                                style={{ flex: 1 }}
                            >
                                Reschedule Appointment
                            </button>
                            <button
                                type="button"
                                className="danger-btn"
                                onClick={() => setShowCancelForm(true)}
                                style={{ flex: 1 }}
                            >
                                Cancel Appointment
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCancel} className="cancel-form">
                            <h3>Cancel Appointment</h3>
                            <p>Please provide a reason for cancelling this appointment.</p>

                            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                                Cancellation Reason
                                <textarea
                                    value={cancellationReason}
                                    onChange={(event) => setCancellationReason(event.target.value)}
                                    placeholder="Enter your reason..."
                                    rows={4}
                                    maxLength={500}
                                    required
                                    style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff", resize: "vertical" }}
                                />
                            </label>

                            <div className="cancel-actions" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                                <button
                                    type="submit"
                                    className="danger-btn"
                                    disabled={cancelling}
                                >
                                    {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                                </button>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => {
                                        setShowCancelForm(false);
                                        setCancelError("");
                                        setCancellationReason("");
                                    }}
                                    disabled={cancelling}
                                >
                                    Keep Appointment
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {appointment.status === "cancelled" && (
                <div className="success-box" style={{ marginTop: "2rem", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444" }}>
                    This appointment has been cancelled.
                </div>
            )}

            {appointment.status === "rescheduled" && (
                <div className="success-box" style={{ marginTop: "2rem", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", color: "#f59e0b" }}>
                    This appointment has been rescheduled.
                </div>
            )}

            {/* Actions Footer */}
            <div className="details-actions" style={{ marginTop: "2rem" }}>
                <Link to="/patient/appointments" className="secondary-btn">
                    Back to Appointments
                </Link>

                {appointment.status === "cancelled" && (
                    <Link to="/patient/doctors" className="primary-btn">
                        Book Another Appointment
                    </Link>
                )}
            </div>
        </main>
    );
};

export default AppointmentDetails;