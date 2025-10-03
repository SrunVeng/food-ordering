import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GroupPage from "./pages/Group.jsx";
import Header from "./components/Header.jsx";

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
    const { token } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-50">
            {token && <Header />}

            <main className="mx-auto max-w-6xl p-4 sm:p-6">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/groups/:groupId"
                        element={
                            <ProtectedRoute>
                                <GroupPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
                </Routes>
            </main>
        </div>
    );
}
