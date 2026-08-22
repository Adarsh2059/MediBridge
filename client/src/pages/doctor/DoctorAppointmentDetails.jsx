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
    const { appointmentId } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Consultation states
    const [preVisit, setPreVisit] = useState(null);
    const [consultation, setConsultation] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [followUpInstructions, setFollowUpInstructions] = useState("");
    const [prescription, setPrescription] = useState([]);

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

    const updateStatus = async (status) => {
        try {
            setError("");
            await api.patch(`/appointments/${appointmentId}/status`, { status });
            await fetchAppointment();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to update appointment status"
            );
        }
    };

    const addPrescriptionItem = () => {
        setPrescription([
            ...prescription,
            { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
        ]);
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescription];
        updated[index][field] = value;
        setPrescription(updated);
    };

    const removePrescriptionItem = (index) => {
        const updated = [...prescription];
        updated.splice(index, 1);
        setPrescription(updated);
    };

    const submitConsultation = async (e) => {
        e.preventDefault();
        if (!clinicalNotes.trim()) {
            setError("Clinical notes are required");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccessMessage("");

            const response = await api.post("/consultations", {
                appointmentId,
                clinicalNotes,
                diagnosis,
                prescription,
                followUpInstructions
            });

            setSuccessMessage("Consultation saved.");
            const data = response.data?.data?.consultation || response.data?.consultation;
            if (data) {
                setConsultation(data);
            }
            await fetchAppointment();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to submit consultation"
            );
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!appointmentId) {
            return;
        }
        fetchAppointment();
    }, [appointmentId]);

    useEffect(() => {
        if (!appointmentId) return;

        const loadExtraDetails = async () => {
            try {
                const preVisitRes = await api.get(`/pre-visit/${appointmentId}`);
                const data = preVisitRes.data?.data || preVisitRes.data;
                setPreVisit(data);
            } catch (err) {
                console.log("No pre-visit assessment found or failed to load");
            }

            if (appointment?.status === "completed") {
                try {
                    const consultationRes = await api.get(`/consultations/appointment/${appointmentId}`);
                    const data = consultationRes.data?.data?.consultation || consultationRes.data?.consultation;
                    if (data) {
                        setConsultation(data);
                    }
                } catch (err) {
                    console.log("No consultation found or failed to load");
                }
            }
        };

        loadExtraDetails();
    }, [appointmentId, appointment?.status]);

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
                <Link to="/doctor" className="secondary-btn">
                    Back to Dashboard
                </Link>
            </main>
        );
    }

    if (!appointment) {
        return null;
    }

    const patient = appointment.patient;

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">Consultation</span>
                <h1>Patient Appointment</h1>
                <p>Review patient information, pre-visit summary, and complete the post-visit consultation.</p>
            </section>

            {error && <div className="error-box" style={{ marginBottom: "2rem" }}>{error}</div>}
            {successMessage && <div className="success-box" style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981" }}>{successMessage}</div>}

            <section className="details-card">
                <div className="details-header">
                    <div>
                        <span className="eyebrow">Patient</span>
                        <h2>{patient?.name || "Patient"}</h2>
                        <p>{patient?.email || "Email unavailable"}</p>
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
                        <span>Patient Phone</span>
                        <strong>{patient?.phone || "Not provided"}</strong>
                    </div>
                    <div>
                        <span>Appointment Status</span>
                        <strong>{appointment.status}</strong>
                    </div>
                </div>

                <div className="details-section">
                    <h3>Patient Provided Symptoms</h3>
                    <p>{appointment.symptoms || "No symptoms provided."}</p>
                </div>

                {appointment.bookingNotes && (
                    <div className="details-section">
                        <h3>Booking Notes</h3>
                        <p>{appointment.bookingNotes}</p>
                    </div>
                )}
            </section>

            {/* Pre-Visit AI Assessment Section */}
            {preVisit && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">AI Pre-Visit Assessment</span>
                            <h2>Symptom Urgency: <span className={`urgency-${preVisit.urgency}`} style={{ fontWeight: "bold", textTransform: "capitalize", color: preVisit.urgency === "high" ? "#ef4444" : preVisit.urgency === "medium" ? "#f59e0b" : "#10b981" }}>{preVisit.urgency || "low"}</span></h2>
                        </div>
                        <span className="status status-completed">AI Processed</span>
                    </div>
                    
                    {preVisit.status === "processing" && <p>Pre-visit analysis is being generated...</p>}
                    {preVisit.status === "failed" && <p style={{ color: "#ef4444" }}>AI pre-visit analysis is temporarily unavailable.</p>}
                    {preVisit.status === "completed" && (
                        <>
                            <div className="details-section" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
                                <h3>Chief Complaint Summary</h3>
                                <p>{preVisit.chiefComplaint}</p>
                            </div>
                            <div className="details-section">
                                <h3>Suggested Diagnostic Questions</h3>
                                <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }}>
                                    {preVisit.suggestedQuestions?.map((q, idx) => (
                                        <li key={idx} style={{ marginBottom: "0.5rem" }}>{q.question}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Post-Visit Consultation Form or View Section */}
            {appointment.status === "confirmed" && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">Post-Visit Consultation</span>
                            <h2>Complete Visit & Enter Notes</h2>
                        </div>
                    </div>

                    <form onSubmit={submitConsultation} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontWeight: "bold" }}>Clinical Notes *</label>
                            <textarea
                                value={clinicalNotes}
                                onChange={(e) => setClinicalNotes(e.target.value)}
                                placeholder="Enter clinical notes, history, findings..."
                                rows={6}
                                required
                                style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff", resize: "vertical" }}
                            />
                        </div>

                        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontWeight: "bold" }}>Diagnosis / Observations</label>
                            <input
                                type="text"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="Enter primary diagnosis..."
                                style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff" }}
                            />
                        </div>

                        <div className="details-section" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                            <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                Prescription
                                <button type="button" className="secondary-btn" onClick={addPrescriptionItem} style={{ padding: "0.4rem 1rem", fontSize: "0.9rem" }}>
                                    + Add Medicine
                                </button>
                            </h3>

                            {prescription.length === 0 ? (
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: "1rem 0" }}>No medicines prescribed.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                                    {prescription.map((item, idx) => (
                                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr auto", gap: "0.8rem", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <input
                                                type="text"
                                                placeholder="Medicine Name"
                                                value={item.medicine}
                                                onChange={(e) => handlePrescriptionChange(idx, "medicine", e.target.value)}
                                                required
                                                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dosage (e.g. 500mg)"
                                                value={item.dosage}
                                                onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                                                required
                                                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Frequency (e.g. twice daily)"
                                                value={item.frequency}
                                                onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                                                required
                                                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Duration (e.g. 5 days)"
                                                value={item.duration}
                                                onChange={(e) => handlePrescriptionChange(idx, "duration", e.target.value)}
                                                required
                                                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Instructions (e.g. after meals)"
                                                value={item.instructions}
                                                onChange={(e) => handlePrescriptionChange(idx, "instructions", e.target.value)}
                                                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}
                                            />
                                            <button type="button" onClick={() => removePrescriptionItem(idx)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1.2rem", cursor: "pointer", padding: "0 0.5rem" }} title="Remove">
                                                X
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontWeight: "bold" }}>Follow-up Instructions</label>
                            <textarea
                                value={followUpInstructions}
                                onChange={(e) => setFollowUpInstructions(e.target.value)}
                                placeholder="Enter follow-up steps, lifestyle recommendations..."
                                rows={3}
                                style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff", resize: "vertical" }}
                            />
                        </div>

                        <button type="submit" className="primary-btn" disabled={submitting}>
                            {submitting ? "Submitting Consultation..." : "Submit Consultation"}
                        </button>
                    </form>
                </section>
            )}

            {appointment.status === "completed" && consultation && (
                <section className="details-card" style={{ marginTop: "2rem" }}>
                    <div className="details-header">
                        <div>
                            <span className="eyebrow">Post-Visit Consultation Summary</span>
                            <h2>Diagnosis: {consultation.diagnosis || "No specific diagnosis recorded"}</h2>
                        </div>
                        {consultation.aiStatus === "processing" && (
                            <span className="status status-pending" style={{ backgroundColor: "#f59e0b" }}>AI Processing</span>
                        )}
                        {consultation.aiStatus === "completed" && (
                            <span className="status status-completed">AI Synced</span>
                        )}
                        {consultation.aiStatus === "failed" && (
                            <span className="status status-cancelled">AI Failed</span>
                        )}
                    </div>

                    <div className="details-section" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
                        <h3>Clinical Notes</h3>
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

                    {/* AI Patient Summary Status Messages */}
                    <div style={{ marginTop: "2.5rem", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "1.5rem" }}>
                        <h3>AI-Generated Patient Copy</h3>
                        {consultation.aiStatus === "processing" && (
                            <p style={{ color: "#f59e0b", fontStyle: "italic" }}>
                                Patient summary is being generated...
                            </p>
                        )}
                        {consultation.aiStatus === "failed" && (
                            <p style={{ color: "#ef4444" }}>
                                Consultation saved. Patient summary is temporarily unavailable.
                            </p>
                        )}
                        {consultation.aiStatus === "completed" && consultation.aiSummary && (
                            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>{consultation.aiSummary.summary}</p>
                                
                                {consultation.aiSummary.medicationSchedule?.length > 0 && (
                                    <div style={{ marginTop: "1rem" }}>
                                        <h4 style={{ margin: "0.5rem 0", color: "#10b981" }}>Patient Medication Schedule</h4>
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
                                        <h4 style={{ margin: "0.5rem 0", color: "#10b981" }}>Follow-up Steps</h4>
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

            {appointment.status === "booked" && (
                <div className="details-actions">
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={() => updateStatus("confirmed")}
                    >
                        Confirm Appointment
                    </button>
                </div>
            )}

            <div className="details-actions" style={{ marginTop: "2rem" }}>
                <Link to="/doctor" className="secondary-btn">
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
};

export default DoctorAppointmentDetails;