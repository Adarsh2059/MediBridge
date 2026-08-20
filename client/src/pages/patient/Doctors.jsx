import {
    useEffect,
    useState
} from "react";

import api from "../../api/axios.js";

import DoctorCard from "../../components/DoctorCard.jsx";

const Doctors = () => {
    const [doctors, setDoctors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const fetchDoctors = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {};

            /*
             * Backend supports specialization
             * filtering, not a generic "search"
             * parameter.
             */
            if (search.trim()) {
                params.specialization =
                    search.trim();
            }

            const response =
                await api.get(
                    "/doctors",
                    {
                        params
                    }
                );

            const data =
                response.data?.data ||
                response.data;

            setDoctors(
                Array.isArray(
                    data?.doctors
                )
                    ? data.doctors
                    : []
            );
        } catch (error) {
            console.error(
                "Failed to fetch doctors:",
                error
            );

            setError(
                error.response
                    ?.data?.message ||
                    "Unable to load doctors"
            );

            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        fetchDoctors();
    };

    return (
        <main className="dashboard">
            <section className="dashboard-hero">
                <span className="eyebrow">
                    Find Healthcare
                </span>

                <h1>
                    Find the right doctor
                </h1>

                <p>
                    Browse doctors by
                    specialization and
                    availability.
                </p>
            </section>

            <form
                className="doctor-search"
                onSubmit={
                    handleSearch
                }
            >
                <input
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                    placeholder="Search by specialization..."
                />

                <button
                    type="submit"
                    className="primary-btn"
                >
                    Search
                </button>
            </form>

            {error && (
                <div className="error-box">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="page-loader">
                    Loading doctors...
                </div>
            ) : doctors.length ===
              0 ? (
                <div className="empty-state">
                    <h2>
                        No doctors found
                    </h2>

                    <p>
                        Try another
                        specialization.
                    </p>
                </div>
            ) : (
                <section className="doctor-grid">
                    {doctors.map(
                        (doctor) => (
                            <DoctorCard
                                key={
                                    doctor.profile
                                        ?.id ||
                                    doctor.id
                                }
                                doctor={
                                    doctor
                                }
                            />
                        )
                    )}
                </section>
            )}
        </main>
    );
};

export default Doctors;