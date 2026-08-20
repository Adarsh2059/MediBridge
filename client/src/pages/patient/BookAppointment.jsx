import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../../api/axios.js";

const BookAppointment = () => {
    const {
        doctorId
    } = useParams();

    const navigate =
        useNavigate();

    const [doctor, setDoctor] =
        useState(null);

    const [date, setDate] =
        useState("");

    const [availability, setAvailability] =
        useState(null);

    const [selectedSlot, setSelectedSlot] =
        useState(null);

    const [symptoms, setSymptoms] =
        useState("");

    const [bookingNotes, setBookingNotes] =
        useState("");

    const [loadingDoctor, setLoadingDoctor] =
        useState(true);

    const [loadingSlots, setLoadingSlots] =
        useState(false);

    const [booking, setBooking] =
        useState(false);

    const [error, setError] =
        useState("");

    const [hold, setHold] =
        useState(null);

    /*
     * Load doctor profile.
     *
     * The backend expects the DoctorProfile
     * ID in /doctors/:id.
     */
    useEffect(() => {
        if (!doctorId) {
            setError(
                "Invalid doctor ID. Please select a doctor again."
            );

            setLoadingDoctor(false);

            return;
        }

        const fetchDoctor =
            async () => {
                try {
                    const response =
                        await api.get(
                            `/doctors/${doctorId}`
                        );

                    const data =
                        response.data
                            ?.data ||
                        response.data;

                    setDoctor(
                        data?.doctor ||
                            null
                    );
                } catch (error) {
                    console.error(
                        "Failed to fetch doctor:",
                        error
                    );

                    setError(
                        error.response
                            ?.data
                            ?.message ||
                            "Unable to load doctor"
                    );
                } finally {
                    setLoadingDoctor(
                        false
                    );
                }
            };

        fetchDoctor();
    }, [doctorId]);

    /*
     * Load availability whenever
     * the selected date changes.
     */
    useEffect(() => {
        if (
            !doctorId ||
            !date
        ) {
            setAvailability(null);
            setSelectedSlot(null);
            return;
        }

        const fetchAvailability =
            async () => {
                setLoadingSlots(true);
                setError("");
                setSelectedSlot(null);
                setHold(null);

                try {
                    const response =
                        await api.get(
                            `/doctors/${doctorId}/availability`,
                            {
                                params: {
                                    date
                                }
                            }
                        );

                    const availabilityData =
    response.data
        ?.data
        ?.availability ||
    response.data
        ?.availability ||
    response.data;

setAvailability(
    availabilityData
);
                } catch (error) {
                    console.error(
                        "Failed to fetch availability:",
                        error
                    );

                    setError(
                        error.response
                            ?.data
                            ?.message ||
                            "Unable to load availability"
                    );

                    setAvailability(
                        null
                    );
                } finally {
                    setLoadingSlots(
                        false
                    );
                }
            };

        fetchAvailability();
    }, [
        doctorId,
        date
    ]);

    /*
     * Hold the selected slot before
     * collecting the final booking data.
     */
    const handleHoldSlot =
        async (slot) => {
            if (!doctorId) {
                setError(
                    "Invalid doctor ID"
                );

                return;
            }

            setError("");
            setSelectedSlot(
                slot
            );
            setHold(null);

            try {
                const response =
                    await api.post(
                        "/appointments/hold",
                        {
                            doctorId,
                            date,
                            startTime:
                                slot.start,
                            endTime:
                                slot.end
                        }
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                setHold(
                    data?.hold ||
                        data
                );
            } catch (error) {
                console.error(
                    "Failed to hold appointment slot:",
                    error
                );

                setSelectedSlot(
                    null
                );

                setError(
                    error.response
                        ?.data
                        ?.message ||
                        "Unable to hold this slot"
                );
            }
        };

    /*
     * Confirm the appointment
     * using the active slot hold.
     */
    const handleBooking =
        async (event) => {
            event.preventDefault();

            if (!hold) {
                setError(
                    "Please select an available slot first"
                );

                return;
            }

            if (
                !symptoms.trim()
            ) {
                setError(
                    "Please describe your symptoms"
                );

                return;
            }

            const holdId =
                hold?.holdId ||
                hold?._id ||
                hold?.id;

            if (!holdId) {
                setError(
                    "Appointment hold is invalid or expired. Please select the slot again."
                );

                return;
            }

            setBooking(true);
            setError("");

            try {
                const response =
                    await api.post(
                        "/appointments",
                        {
                            holdId,
                            symptoms:
                                symptoms.trim(),
                            bookingNotes:
                                bookingNotes.trim()
                        }
                    );

                const data =
                    response.data
                        ?.data ||
                    response.data;

                const appointment =
                    data?.appointment ||
                    data;

                if (
                    !appointment?._id
                ) {
                    throw new Error(
                        "Appointment was created but no appointment ID was returned"
                    );
                }

                navigate(
                    `/patient/appointments/${appointment._id}`,
                    {
                        state: {
                            bookingSuccess:
                                true
                        }
                    }
                );
            } catch (error) {
                console.error(
                    "Failed to confirm appointment:",
                    error
                );

                setError(
                    error.response
                        ?.data
                        ?.message ||
                        error.message ||
                        "Unable to confirm appointment"
                );
            } finally {
                setBooking(false);
            }
        };

    if (loadingDoctor) {
        return (
            <div className="page-loader">
                Loading doctor...
            </div>
        );
    }

    if (
        !doctor &&
        !loadingDoctor
    ) {
        return (
            <main className="dashboard">
                <div className="error-box">
                    {error ||
                        "Doctor not found"}
                </div>
            </main>
        );
    }

    /*
     * Backend response:
     *
     * doctor.name
     * doctor.profile.specialization
     * doctor.profile.qualification
     */
    const doctorName =
        doctor?.name ||
        "Doctor";

    const specialization =
        doctor?.profile
            ?.specialization ||
        "General Physician";

    const qualification =
        doctor?.profile
            ?.qualification ||
        "Qualified medical professional";

    return (
        <main className="dashboard">
            <section className="booking-header">
                <div className="doctor-avatar large">
                    {doctorName
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div>
                    <span className="eyebrow">
                        Appointment
                    </span>

                    <h1>
                        {doctorName}
                    </h1>

                    <p>
                        {specialization}{" "}
                        ·{" "}
                        {qualification}
                    </p>
                </div>
            </section>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            <section className="booking-layout">
                <div className="booking-panel">
                    <h2>
                        1. Choose a date
                    </h2>

                    <input
                        className="date-input"
                        type="date"
                        min={
                            new Date()
                                .toISOString()
                                .split(
                                    "T"
                                )[0]
                        }
                        value={date}
                        onChange={(
                            event
                        ) =>
                            setDate(
                                event.target
                                    .value
                            )
                        }
                    />

                    {date &&
                        loadingSlots && (
                            <p>
                                Loading
                                available
                                slots...
                            </p>
                        )}

                    {date &&
                        availability && (
                            <>
                                <h2>
                                    2. Choose a
                                    time
                                </h2>

                                {availability.isOnLeave ? (
                                    <div className="empty-state">
                                        <h3>
                                            Doctor is
                                            on leave
                                        </h3>

                                        <p>
                                            Please
                                            choose
                                            another
                                            date.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="slot-grid">
                                        {availability
                                            .slots
                                            ?.length >
                                        0 ? (
                                            availability.slots.map(
                                                (
                                                    slot
                                                ) => (
                                                    <button
                                                        key={`${slot.start}-${slot.end}`}
                                                        type="button"
                                                        disabled={
                                                            slot.status !==
                                                            "available"
                                                        }
                                                        className={`slot-btn ${
                                                            selectedSlot?.start ===
                                                            slot.start
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handleHoldSlot(
                                                                slot
                                                            )
                                                        }
                                                    >
                                                        {
                                                            slot.start
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            slot.end
                                                        }
                                                    </button>
                                                )
                                            )
                                        ) : (
                                            <p>
                                                No
                                                available
                                                slots
                                                for
                                                this
                                                date.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                </div>

                <div className="booking-panel">
                    <h2>
                        3. Tell us about
                        your visit
                    </h2>

                    {hold && (
                        <div className="hold-banner">
                            Slot held:
                            <strong>
                                {" "}
                                {
                                    hold.startTime
                                }{" "}
                                -{" "}
                                {
                                    hold.endTime
                                }
                            </strong>
                        </div>
                    )}

                    <form
                        onSubmit={
                            handleBooking
                        }
                    >
                        <label>
                            Symptoms

                            <textarea
                                value={
                                    symptoms
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSymptoms(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Describe your symptoms..."
                                rows={7}
                                maxLength={
                                    3000
                                }
                                required
                            />

                            <small>
                                {
                                    symptoms.length
                                }
                                /3000
                            </small>
                        </label>

                        <label>
                            Booking Notes

                            <textarea
                                value={
                                    bookingNotes
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBookingNotes(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Anything else the doctor should know?"
                                rows={4}
                                maxLength={
                                    1000
                                }
                            />
                        </label>

                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={
                                !hold ||
                                booking
                            }
                        >
                            {booking
                                ? "Confirming appointment..."
                                : "Confirm Appointment"}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
};

export default BookAppointment;