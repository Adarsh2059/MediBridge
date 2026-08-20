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

const Login = () => {
    const navigate =
        useNavigate();

    const {
        login
    } = useAuth();

    const [form, setForm] =
        useState({
            email: "",
            password: ""
        });

    const [error, setError] =
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
        setLoading(true);

        try {
            const data =
                await login(
                    form.email,
                    form.password
                );

            const role =
                data.user?.role;

            if (
                role ===
                "patient"
            ) {
                navigate(
                    "/patient"
                );
            } else if (
                role ===
                "doctor"
            ) {
                navigate(
                    "/doctor"
                );
            } else {
                navigate("/");
            }
        } catch (error) {
            setError(
                error.response
                    ?.data?.message ||
                    error.message ||
                    "Login failed"
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
                        Welcome back
                    </span>

                    <h1>
                        Sign in to
                        MediBridge
                    </h1>

                    <p>
                        Access your healthcare
                        appointments and
                        services.
                    </p>
                </div>

                {error && (
                    <div className="error-box">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
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
                            placeholder="Enter your password"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default Login;