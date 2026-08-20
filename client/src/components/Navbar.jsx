import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext.jsx";

const Navbar = () => {
    const {
        user,
        logout
    } = useAuth();

    const navigate =
        useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="navbar">
            <Link
                to="/"
                className="brand"
            >
                Medi<span>Bridge</span>
            </Link>

            <nav>
                {user ? (
                    <>
                        {user.role ===
                            "patient" && (
                            <Link to="/patient">
                                Dashboard
                            </Link>
                        )}

                        {user.role ===
                            "doctor" && (
                            <Link to="/doctor">
                                Dashboard
                            </Link>
                        )}

                        {user.role ===
                            "admin" && (
                            <Link to="/admin">
                                Admin Dashboard
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="logout-btn"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            Login
                        </Link>

                        <Link to="/register">
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Navbar;