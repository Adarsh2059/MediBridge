import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import {
    AuthProvider
} from "./context/AuthContext.jsx";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import Doctors from "./pages/patient/Doctors.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import AppointmentDetails from "./pages/patient/AppointmentDetails.jsx";

import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />

                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    {/* Patient routes */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "patient"
                                ]}
                            />
                        }
                    >
                        <Route
                            path="/patient"
                            element={
                                <PatientDashboard />
                            }
                        />

                        <Route
                            path="/patient/doctors"
                            element={
                                <Doctors />
                            }
                        />

                        <Route
                            path="/patient/book/:doctorId"
                            element={
                                <BookAppointment />
                            }
                        />

                        <Route
                            path="/patient/appointments"
                            element={
                                <MyAppointments />
                            }
                        />

                        <Route
                            path="/patient/appointments/:appointmentId"
                            element={
                                <AppointmentDetails />
                            }
                        />
                    </Route>

                    {/* Doctor routes */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "doctor"
                                ]}
                            />
                        }
                    >
                        <Route
                            path="/doctor"
                            element={
                                <DoctorDashboard />
                            }
                        />
                    </Route>

                    {/* Default route */}
                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/login"
                                replace
                            />
                        }
                    />

                    {/* Unknown route */}
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;