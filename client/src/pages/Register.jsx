import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext.jsx";

const Register = () => {
    const navigate =
        useNavigate();

    const {
        register
    } = useAuth();

    const [form, setForm] =
        useState({
            name: "",
            email: "",
            password: ""
        });

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleChange = (
        event
    ) => {
        setForm({
            ...form,
            [event.target.name]:
                event.target.value
        });
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register(form);

            setSuccess(
                "Registration successful. Redirecting to login..."
            );

            setTimeout(
                () =>
                    navigate(
                        "/login"
                    ),
                1000
            );
        } catch (error) {
            setError(
                error.response
                    ?.data?.message ||
                    error.message ||
                    "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="eyebrow">
                        Get started
                    </span>

                    <h1>
                        Create your
                        MediBridge account
                    </h1>

                    <p>
                        Create a patient
                        account to manage
                        appointments and
                        connect with doctors.
                    </p>
                </div>

                {error && (
                    <div className="error-box">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-box">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <label>
                        Full Name

                        <input
                            name="name"
                            value={
                                form.name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Your full name"
                            required
                            minLength={2}
                            maxLength={100}
                        />
                    </label>

                    <label>
                        Email

                        <input
                            type="email"
                            name="email"
                            value={
                                form.email
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="you@example.com"
                            required
                        />
                    </label>

                    <label>
                        Password

                        <input
                            type="password"
                            name="password"
                            value={
                                form.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Create a password"
                            minLength={8}
                            required
                        />

                        <small>
                            Password must
                            contain at least
                            8 characters.
                        </small>
                    </label>

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Patient Account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default Register;