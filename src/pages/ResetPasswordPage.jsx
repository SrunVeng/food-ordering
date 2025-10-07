import { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { performPasswordResetApi } from "../lib/api";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
    const nav = useNavigate();
    const q = useQuery();
    const token = q.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [okMsg, setOkMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setErr(""); setOkMsg("");

        if (!token) {
            setErr("Invalid or missing reset token.");
            return;
        }
        if (password.length < 8) {
            setErr("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setErr("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await performPasswordResetApi({ token, newPassword: password, confirmPassword: confirm });
            setOkMsg("Password updated. Redirecting to login…");
            setTimeout(() => nav("/login"), 1200);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:underline">
                        <ArrowLeft size={16} /> Back to login
                    </Link>
                </div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-xl bg-white p-6 shadow">
                    <h1 className="text-lg font-semibold">Set a new password</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Enter your new password for this account.
                    </p>

                    {!token && (
                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                            Missing or invalid token. Use the link from your email.
                        </div>
                    )}

                    {err && (
                        <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>
                    )}
                    {okMsg && (
                        <div className="mt-4 flex items-start gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                            <CheckCircle2 className="mt-0.5" size={16} />
                            <span>{okMsg}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="password"
                                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                placeholder="New password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="password"
                                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                placeholder="Confirm new password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
