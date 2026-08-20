import { Link } from "react-router-dom";

const AdminDashboard = () => {
    return (
        <main className="dashboard admin-page">
            <section className="dashboard-hero admin-hero">
                <span className="eyebrow">
                    Administration
                </span>

                <h1>
                    MediBridge Admin
                </h1>

                <p>
                    Manage doctors and healthcare
                    providers across the platform.
                </p>
            </section>

            <section className="admin-card-grid">
                <article className="admin-action-card">
                    <div className="admin-card-icon">
                        D
                    </div>

                    <div className="admin-card-content">
                        <span className="eyebrow">
                            Doctors
                        </span>

                        <h2>
                            Doctor Management
                        </h2>

                        <p>
                            Create, update, activate,
                            deactivate and remove doctor
                            accounts.
                        </p>

                        <Link
                            to="/admin/doctors"
                            className="primary-btn"
                        >
                            Manage Doctors
                        </Link>
                    </div>
                </article>

                <article className="admin-action-card">
                    <div className="admin-card-icon">
                        +
                    </div>

                    <div className="admin-card-content">
                        <span className="eyebrow">
                            Registration
                        </span>

                        <h2>
                            Add Doctor
                        </h2>

                        <p>
                            Create a new doctor account
                            with their professional
                            profile and availability.
                        </p>

                        <Link
                            to="/admin/doctors/create"
                            className="primary-btn"
                        >
                            Register Doctor
                        </Link>
                    </div>
                </article>
            </section>
        </main>
    );
};

export default AdminDashboard;