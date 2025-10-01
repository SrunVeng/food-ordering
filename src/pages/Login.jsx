import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
    const nav = useNavigate();
    const { login, register } = useAuth();

    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const doLogin = async (e) => {
        e.preventDefault();
        setErr(""); setLoading(true);
        try {
            await login({ username, password });
            nav("/");
        } catch (e) {
            setErr(e.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const doRegister = async () => {
        setErr(""); setLoading(true);
        try { await register({ username, password }); }
        catch (e) { setErr(e.message || "Register failed"); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                {/* Centered logo */}
                <div className="grid place-items-center mb-6">
                    <div className="grid place-items-center size-14 rounded-2xl bg-white shadow-sm border">
                        <UtensilsCrossed className="h-6 w-6 text-neutral-800" />
                    </div>
                    <h1 className="mt-3 text-lg font-semibold">Welcome Nham Ey</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl bg-white p-6 shadow"
                >
                    {err && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {err}
                        </div>
                    )}

                    <form onSubmit={doLogin} className="space-y-4">
                        {/* Username */}
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="text"
                                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setU(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type={showPw ? "text" : "password"}
                                className="w-full rounded-md border border-neutral-300 pl-9 pr-9 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setP(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Actions (optional) */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="h-4 w-4 text-neutral-600" />
                                Remember me
                            </label>
                            <Link to="/forgot" className="text-neutral-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Buttons */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                        </button>
                        <button
                            type="button"
                            onClick={doRegister}
                            disabled={loading}
                            className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
                        >
                            Register
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
