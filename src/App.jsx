import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./store/auth";
import LoginPage from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GroupPage from "./pages/Group.jsx";
import { LogOut, UtensilsCrossed } from "lucide-react";

function Protected({ children }) {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const { token, user, logout } = useAuth();

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
                <div className="mx-auto max-w-6xl flex items-center justify-between p-4">
                    <Link to="/" className="flex items-center gap-2">
                        <UtensilsCrossed className="size-6 text-neutral-800" />
                        <span className="font-semibold">Lunch Groups</span>
                    </Link>

                    {token ? (
                        <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600">
                {user?.username}
              </span>
                            <button className="btn btn-ghost" onClick={logout}>
                                <LogOut className="size-4" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link className="btn btn-primary" to="/login">Login</Link>
                    )}
                </div>
            </header>

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
