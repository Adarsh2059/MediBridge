import {
    Navigate,
    Outlet,
    useLocation
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext.jsx";

const ProtectedRoute = ({
    allowedRoles
}) => {
    const {
        user,
        loading
    } = useAuth();

    const location =
        useLocation();

    if (loading) {
        return (
            <div className="page-loader">
                Loading MediBridge...
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }

    if (
        allowedRoles?.length &&
        !allowedRoles.includes(
            user.role
        )
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;