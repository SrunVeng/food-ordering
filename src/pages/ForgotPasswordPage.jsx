import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordResetApi } from "../lib/api";

export default function ForgotPasswordPage() {
    const nav = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [okMsg, setOkMsg] = useState("");

    const isValidEmail = (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

    const submit = async (e) => {
        e.preventDefault();
        setErr(""); setOkMsg("");
        if (!isValidEmail(email)) {
            setErr("Please enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            await requestPasswordResetApi(email.trim());
            // Option A: show success here
            setOkMsg("If that email exists, we’ve sent an OTP / reset link.");
            // Option B (navigate back to login with flash):
            // nav("/login", { state: { msg: "Check your inbox for the reset email." } });
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "Failed to start password reset.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:underline"
                    >
                        <ArrowLeft size={16} /> Back to login
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl bg-white p-6 shadow"
                >
                    <h1 className="text-lg font-semibold">Reset your password</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Enter the email you registered with.
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                        We’ll send a reset link.
                    </p>

                    {err && (
                        <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {err}
                        </div>
                    )}
                    {okMsg && (
                        <div className="mt-4 flex items-start gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                            <CheckCircle2 className="mt-0.5" size={16} />
                            <span>{okMsg}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="email"
                                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                aria-invalid={!!err}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset email"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
