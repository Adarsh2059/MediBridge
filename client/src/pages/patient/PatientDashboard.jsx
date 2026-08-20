import {
    Link
} from "react-router-dom";

import {
    useAuth
} from "../../context/AuthContext.jsx";

const PatientDashboard = () => {
    const {
        user
    } = useAuth();

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <div>
                    <span className="eyebrow">
                        Patient Portal
                    </span>

                    <h1>
                        Hello,{" "}
                        {user?.name ||
                            "Patient"}
                        .
                    </h1>

                    <p>
                        Manage your healthcare
                        appointments from one
                        place.
                    </p>
                </div>
            </section>

            <section className="dashboard-grid">
                <Link
                    to="/patient/doctors"
                    className="dashboard-card"
                >
                    <div className="card-icon">
                        +
                    </div>

                    <h2>
                        Book Appointment
                    </h2>

                    <p>
                        Find a doctor and
                        choose an available
                        appointment slot.
                    </p>
                </Link>

                <Link
                    to="/patient/appointments"
                    className="dashboard-card"
                >
                    <div className="card-icon">
                        ✓
                    </div>

                    <h2>
                        My Appointments
                    </h2>

                    <p>
                        View upcoming and
                        previous appointments.
                    </p>
                </Link>
            </section>
        </main>
    );
};

export default PatientDashboard;