import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../api/axios.js";

const AuthContext =
    createContext(null);

export const AuthProvider = ({
    children
}) => {
    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const storedUser =
            localStorage.getItem(
                "medibridge_user"
            );

        if (storedUser) {
            try {
                setUser(
                    JSON.parse(
                        storedUser
                    )
                );
            } catch {
                localStorage.removeItem(
                    "medibridge_user"
                );
            }
        }

        setLoading(false);
    }, []);

    const login = async (
        email,
        password
    ) => {
        const response =
            await api.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );

        const data =
            response.data?.data ||
            response.data;

        const token =
            data.token ||
            data.accessToken;

        const loggedInUser =
            data.user;

        if (!token) {
            throw new Error(
                "Authentication token was not returned"
            );
        }

        localStorage.setItem(
            "medibridge_token",
            token
        );

        if (loggedInUser) {
            localStorage.setItem(
                "medibridge_user",
                JSON.stringify(
                    loggedInUser
                )
            );

            setUser(
                loggedInUser
            );
        }

        return data;
    };

    const register = async (
        payload
    ) => {
        const response =
            await api.post(
                "/auth/register",
                payload
            );

        return (
            response.data?.data ||
            response.data
        );
    };

    const logout = () => {
        localStorage.removeItem(
            "medibridge_token"
        );

        localStorage.removeItem(
            "medibridge_user"
        );

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated:
                    Boolean(user)
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context =
        useContext(
            AuthContext
        );

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};