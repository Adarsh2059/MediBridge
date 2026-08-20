import {
    useAuth
} from "../../context/AuthContext.jsx";

const DoctorDashboard = () => {
    const {
        user
    } = useAuth();

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
                        Manage your appointments,
                        availability and
                        patients.
                    </p>
                </div>
            </section>

            <section className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-icon">
                        ◷
                    </div>

                    <h2>
                        Today's Appointments
                    </h2>

                    <p>
                        Your appointment
                        management dashboard
                        will appear here.
                    </p>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        ✓
                    </div>

                    <h2>
                        Availability
                    </h2>

                    <p>
                        Manage your working
                        hours and leave.
                    </p>
                </div>
            </section>
        </main>
    );
};

export default DoctorDashboard;