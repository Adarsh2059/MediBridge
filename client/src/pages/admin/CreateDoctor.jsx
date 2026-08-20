import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import api from "../../api/axios.js";

const initialForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    consultationFee: "",
    bio: "",
    slotDuration: "30"
};

const CreateDoctor = () => {
    const navigate =
        useNavigate();

    const [form, setForm] =
        useState(initialForm);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const handleChange = (
        event
    ) => {
        const {
            name,
            value
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await api.post(
                "/doctors",
                {
                    name:
                        form.name.trim(),

                    email:
                        form.email.trim(),

                    password:
                        form.password,

                    phone:
                        form.phone.trim(),

                    specialization:
                        form.specialization.trim(),

                    qualification:
                        form.qualification.trim(),

                    experience:
                        Number(
                            form.experience
                        ),

                    consultationFee:
                        Number(
                            form.consultationFee
                        ),

                    bio:
                        form.bio.trim(),

                    slotDuration:
                        Number(
                            form.slotDuration
                        )
                }
            );

            setSuccess(
                "Doctor account created successfully."
            );

            setForm(
                initialForm
            );
        } catch (error) {
            setError(
                error.response
                    ?.data
                    ?.message ||
                "Unable to create doctor"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="dashboard admin-page">

            <section className="dashboard-hero admin-hero">
                <span className="eyebrow">
                    Doctor Management
                </span>

                <h1>
                    Register Doctor
                </h1>

                <p>
                    Create a doctor account
                    and professional profile.
                </p>
            </section>

            {error && (
                <div className="error-box admin-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-box admin-message">
                    {success}
                </div>
            )}

            <section className="admin-form-card">

                <div className="admin-form-header">
                    <div>
                        <span className="eyebrow">
                            Professional Profile
                        </span>

                        <h2>
                            Doctor Information
                        </h2>

                        <p>
                            Enter the doctor's
                            account and professional
                            details.
                        </p>
                    </div>
                </div>

                <form
                    className="admin-doctor-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="admin-form-section">

                        <div className="admin-section-heading">
                            <span>
                                01
                            </span>

                            <div>
                                <h3>
                                    Account Details
                                </h3>

                                <p>
                                    Login information
                                    for the doctor.
                                </p>
                            </div>
                        </div>

                        <div className="admin-form-grid">

                            <label>
                                <span>
                                    Full Name
                                </span>

                                <input
                                    name="name"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Dr. Rahul Sharma"
                                    required
                                />
                            </label>

                            <label>
                                <span>
                                    Email Address
                                </span>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="doctor@example.com"
                                    required
                                />
                            </label>

                            <label>
                                <span>
                                    Password
                                </span>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    required
                                />
                            </label>

                            <label>
                                <span>
                                    Phone Number
                                </span>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="9876543210"
                                />
                            </label>

                        </div>
                    </div>

                    <div className="admin-form-divider" />

                    <div className="admin-form-section">

                        <div className="admin-section-heading">
                            <span>
                                02
                            </span>

                            <div>
                                <h3>
                                    Professional Details
                                </h3>

                                <p>
                                    Medical qualification
                                    and consultation
                                    information.
                                </p>
                            </div>
                        </div>

                        <div className="admin-form-grid">

                            <label>
                                <span>
                                    Specialization
                                </span>

                                <input
                                    name="specialization"
                                    value={
                                        form.specialization
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Cardiology"
                                    required
                                />
                            </label>

                            <label>
                                <span>
                                    Qualification
                                </span>

                                <input
                                    name="qualification"
                                    value={
                                        form.qualification
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="MBBS, MD Cardiology"
                                    required
                                />
                            </label>

                            <label>
                                <span>
                                    Experience
                                </span>

                                <div className="input-with-suffix">
                                    <input
                                        type="number"
                                        name="experience"
                                        value={
                                            form.experience
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        max="70"
                                        placeholder="8"
                                        required
                                    />

                                    <span>
                                        years
                                    </span>
                                </div>
                            </label>

                            <label>
                                <span>
                                    Consultation Fee
                                </span>

                                <div className="input-with-prefix">
                                    <span>
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="consultationFee"
                                        value={
                                            form.consultationFee
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        placeholder="800"
                                        required
                                    />
                                </div>
                            </label>

                            <label>
                                <span>
                                    Slot Duration
                                </span>

                                <select
                                    name="slotDuration"
                                    value={
                                        form.slotDuration
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option value="15">
                                        15 minutes
                                    </option>

                                    <option value="20">
                                        20 minutes
                                    </option>

                                    <option value="30">
                                        30 minutes
                                    </option>

                                    <option value="45">
                                        45 minutes
                                    </option>

                                    <option value="60">
                                        60 minutes
                                    </option>
                                </select>
                            </label>

                        </div>
                    </div>

                    <div className="admin-form-divider" />

                    <div className="admin-form-section">

                        <div className="admin-section-heading">
                            <span>
                                03
                            </span>

                            <div>
                                <h3>
                                    Professional Bio
                                </h3>

                                <p>
                                    Add a short
                                    description about
                                    the doctor.
                                </p>
                            </div>
                        </div>

                        <label className="admin-full-field">
                            <span>
                                Bio
                            </span>

                            <textarea
                                name="bio"
                                value={
                                    form.bio
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Doctor's professional background..."
                                rows={6}
                                maxLength={1000}
                            />

                            <small>
                                {form.bio.length}
                                /1000 characters
                            </small>
                        </label>

                    </div>

                    <div className="admin-form-actions">

                        <Link
                            to="/admin/doctors"
                            className="secondary-btn"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={
                                loading
                            }
                        >
                            {loading
                                ? "Creating Doctor..."
                                : "Create Doctor"}
                        </button>

                    </div>

                </form>
            </section>
        </main>
    );
};

export default CreateDoctor;