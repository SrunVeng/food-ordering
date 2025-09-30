import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import LoginPage from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GroupPage from "./pages/Group.jsx";
import Header from "./components/Header.jsx";

function Protected({ children }) {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const { token } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-50">
            {token && <Header />}

            <main className="mx-auto max-w-6xl p-4 sm:p-6">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <Protected>
                                <Dashboard />
                            </Protected>
                        }
                    />
                    <Route
                        path="/groups/:groupId"
                        element={
                            <Protected>
                                <GroupPage />
                            </Protected>
                        }
                    />
                    <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
                </Routes>
            </main>
        </div>
    );
}
