// src/pages/AdminSetPassword.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

/** ===== Config: adjust to your backend ===== */
const API_BASE_URL = import.meta?.env?.VITE_API_URL || ""; // e.g. "https://api.nhamey.example"
const ENDPOINT = "/auth/admin/set-password";                // POST { token, password }

/** Small helper: read query params */
function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

/** Basic password scoring for UI feedback */
function scorePassword(pw) {
    if (!pw) return 0;
    const lengthScore = Math.min(10, Math.floor(pw.length / 2));
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSymbol = /[^\w\s]/.test(pw);
    const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
    return Math.min(30, lengthScore + variety * 5); // 0–30
}

/** Safe JSON parse */
async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
}

/** The page */
export default function AdminSetPassword() {
    const q = useQuery();
    const navigate = useNavigate();
    const token = q.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const pwScore = scorePassword(password);
    const pwStrength = useMemo(() => {
        if (pwScore >= 24) return { label: "Strong", cls: "bg-green-600", width: "100%" };
        if (pwScore >= 16) return { label: "Medium", cls: "bg-yellow-500", width: "66%" };
        if (pwScore > 0)   return { label: "Weak", cls: "bg-red-500", width: "33%" };
        return { label: "—", cls: "bg-gray-300", width: "0%" };
    }, [pwScore]);

    const meetsPolicy =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[^\w\s]/.test(password);

    const isValid = meetsPolicy && confirm === password && !!token;

    useEffect(() => {
        if (!token) {
            setError("Missing or invalid invitation token. Ask your team to resend your admin invite.");
        }
    }, [token]);

    async function onSubmit(e) {
        e.preventDefault();
        if (!isValid || submitting) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch(API_BASE_URL + ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
                credentials: "include",
            });

            if (!res.ok) {
                const data = await safeJson(res);
                throw new Error(data?.message || `Failed (${res.status}) to set password`);
            }

            setDone(true);
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return <SuccessCard onGoLogin={() => navigate("/login")} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gray-900 text-white">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Set your administrator password</h1>
                        <p className="text-sm text-gray-500">Secure your new admin access to NHAM_EY.</p>
                    </div>
                </div>

                {error ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">
                        <AlertTriangle className="mt-0.5" size={18} />
                        <div className="text-sm">{error}</div>
                    </div>
                ) : null}

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 chars, mixed types"
                                className="w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 p-3 pr-10"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Strength meter */}
                        <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${pwStrength.cls}`} style={{ width: pwStrength.width }} />
                            </div>
                            <div className="mt-1 text-xs text-gray-500">Strength: {pwStrength.label}</div>
                            <ul className="mt-2 text-xs text-gray-500 space-y-1">
                                <Req ok={password.length >= 8} text="At least 8 characters" />
                                <Req ok={/[A-Z]/.test(password)} text="Uppercase letter (A–Z)" />
                                <Req ok={/[a-z]/.test(password)} text="Lowercase letter (a–z)" />
                                <Req ok={/\d/.test(password)} text="Digit (0–9)" />
                                <Req ok={/[^\w\s]/.test(password)} text="Symbol (!@#$…)" />
                            </ul>
                        </div>
                    </div>

                    {/* Confirm */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Type it again"
                                className="w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 p-3 pr-10"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
                                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirm && confirm !== password ? (
                            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid || submitting}
                        className={`w-full rounded-xl p-3 font-semibold text-white transition ${
                            isValid && !submitting
                                ? "bg-gray-900 hover:bg-black"
                                : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        {submitting ? "Setting password…" : "Set password"}
                    </button>

                    <div className="flex items-center justify-between text-sm mt-2">
                        <Link to="/login" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
                            <ArrowLeft size={16} /> Back to login
                        </Link>
                        <a href="mailto:nhameyorder@gmail.com" className="text-gray-600 hover:text-gray-900">
                            Need help?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

/** Bullet item with check indicator */
function Req({ ok, text }) {
    return (
        <li className="flex items-center gap-2">
      <span
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
              ok ? "bg-green-600" : "bg-gray-300"
          }`}
      >
        {ok ? <CheckCircle2 size={12} className="text-white" /> : <span className="block w-2 h-2 bg-white rounded-full" />}
      </span>
            <span>{text}</span>
        </li>
    );
}

/** Success view */
function SuccessCard({ onGoLogin }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle2 className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Password set successfully</h2>
                <p className="text-sm text-gray-500 mt-1">You can now sign in with your new admin credentials.</p>
                <button
                    onClick={onGoLogin}
                    className="mt-4 w-full rounded-xl p-3 font-semibold text-white bg-gray-900 hover:bg-black"
                >
                    Go to login
                </button>
            </div>
        </div>
    );
}
