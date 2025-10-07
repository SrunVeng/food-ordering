import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

/** ---------- Reusable 6-box OTP input (JSX) ---------- */
function OTPInput({ value, onChange, length = 6, autoFocus = true, name = "otp" }) {
    const chars = useMemo(() => {
        const v = (value || "").slice(0, length).padEnd(length, " ");
        return v.split("");
    }, [value, length]);

    const inputsRef = useRef([]);

    useEffect(() => {
        if (autoFocus && inputsRef.current[0]) {
            inputsRef.current[0].focus();
        }
    }, [autoFocus]);

    const setChar = (i, c) => {
        const normalized = c.replace(/\D/g, "").slice(0, 1);
        if (!normalized) return;
        const next = (value || "").split("");
        next[i] = normalized;
        const filled = next.join("").slice(0, length);
        onChange(filled);
        if (i < length - 1) inputsRef.current[i + 1]?.focus();
    };

    const clearChar = (i) => {
        const next = (value || "").split("");
        next[i] = "";
        onChange(next.join(""));
    };

    const handlePaste = (i, e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "");
        if (!text) return;
        const current = (value || "").split("");
        for (let k = 0; k < text.length && i + k < length; k++) {
            current[i + k] = text[k];
        }
        onChange(current.join("").slice(0, length));
        const lastIndex = Math.min(i + text.length, length - 1);
        inputsRef.current[lastIndex]?.focus();
    };

    return (
        <div className="flex items-center justify-between gap-2" role="group" aria-label="One-time passcode">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => {
                        if (el) inputsRef.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    pattern="\d*"
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    name={`${name}-${i}`}
                    value={chars[i] === " " ? "" : chars[i]}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                            clearChar(i);
                            return;
                        }
                        // Some mobile keyboards insert multiple digits at once
                        if (v.length > 1) {
                            const digits = v.replace(/\D/g, "");
                            if (!digits) return;
                            const current = (value || "").split("");
                            for (let k = 0; k < digits.length && i + k < length; k++) {
                                current[i + k] = digits[k];
                            }
                            onChange(current.join("").slice(0, length));
                            const lastIndex = Math.min(i + digits.length, length - 1);
                            inputsRef.current[lastIndex]?.focus();
                            return;
                        }
                        setChar(i, v);
                    }}
                    onKeyDown={(e) => {
                        const target = e.currentTarget;
                        if (e.key === "Backspace") {
                            if (target.value) {
                                clearChar(i);
                            } else if (i > 0) {
                                inputsRef.current[i - 1]?.focus();
                                const prev = inputsRef.current[i - 1];
                                if (prev) prev.select();
                            }
                            e.preventDefault();
                        } else if (e.key === "ArrowLeft" && i > 0) {
                            inputsRef.current[i - 1]?.focus();
                            e.preventDefault();
                        } else if (e.key === "ArrowRight" && i < length - 1) {
                            inputsRef.current[i + 1]?.focus();
                            e.preventDefault();
                        }
                    }}
                    onPaste={(e) => handlePaste(i, e)}
                    className="h-12 w-12 text-center text-lg tracking-widest rounded-md border border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                />
            ))}
        </div>
    );
}

/** ---------- Page (JSX) ---------- */
export default function RegisterPage() {
    const nav = useNavigate();
    const { registerStart, registerVerify } = useAuth();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        email: "",
    });

    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [step, setStep] = useState("form"); // 'form' | 'otp'
    const [otp, setOtp] = useState("");

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
    const requiredFilled =
        form.firstName &&
        form.lastName &&
        form.username &&
        form.password &&
        form.confirmPassword &&
        form.phoneNumber &&
        form.email;
    const canSubmit = requiredFilled && !pwMismatch;

    const submitStart = async (e) => {
        e.preventDefault();
        setErr("");

        if (!requiredFilled) {
            setErr("Please fill in all required fields.");
            return;
        }
        if (pwMismatch) {
            setErr("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await registerStart(form); // calls /user/register (sends OTP)
            setStep("otp");
        } catch (e) {
            setErr(e?.message || "Register failed");
        } finally {
            setLoading(false);
        }
    };

    const submitVerify = async (e) => {
        e.preventDefault();
        setErr("");

        if (!/^\d{6}$/.test(otp)) {
            setErr("Please enter the 6-digit code.");
            return;
        }

        setLoading(true);
        try {
            await registerVerify({
                email: form.email,
                username: form.username,
                otp,
                confirmPassword: form.confirmPassword,
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                password: form.password,
            });
            nav("/login", { state: { msg: "Account created. You can now log in." }, replace: true });
        } catch (e) {
            setErr(e?.message || "OTP verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
            <div className="w-full max-w-md">
                <div className="mb-4">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800">
                        <ArrowLeft size={16} /> Back to login
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl bg-white p-6 shadow"
                >
                    <h1 className="text-lg font-semibold mb-4">
                        {step === "form" ? "Create your account" : "Verify your email"}
                    </h1>

                    {err && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}

                    {step === "form" ? (
                        <form onSubmit={submitStart} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">First name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={onChange}
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Last Name */}
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Last name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={onChange}
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Username *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="username"
                                        value={form.username}
                                        onChange={onChange}
                                        autoComplete="username"
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Phone number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={onChange}
                                        autoComplete="tel"
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="+855…"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="email"
                                        value={form.email}
                                        onChange={onChange}
                                        autoComplete="email"
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="password"
                                        type={showPw ? "text" : "password"}
                                        value={form.password}
                                        onChange={onChange}
                                        autoComplete="new-password"
                                        className="w-full rounded-md border border-neutral-300 pl-9 pr-9 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
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
                            </div>

                            {/* Confirm Password */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Confirm password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        name="confirmPassword"
                                        type={showPw2 ? "text" : "password"}
                                        value={form.confirmPassword}
                                        onChange={onChange}
                                        autoComplete="new-password"
                                        className={`w-full rounded-md border pl-9 pr-9 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 ${
                                            pwMismatch ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-neutral-300"
                                        }`}
                                        placeholder="Repeat password"
                                        minLength={6}
                                        required
                                        aria-invalid={pwMismatch}
                                        aria-describedby="pw-mismatch"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw2(!showPw2)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                        aria-label={showPw2 ? "Hide confirm password" : "Show confirm password"}
                                    >
                                        {showPw2 ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {pwMismatch && (
                                    <p id="pw-mismatch" className="mt-1 text-xs text-red-600">
                                        Passwords do not match.
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="sm:col-span-2 space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || !canSubmit}
                                    className="w-full inline-flex items-center justify-center rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {loading ? "Sending code…" : "Create account"}
                                </button>
                                <p className="text-center text-sm text-neutral-600">
                                    Already have an account?{" "}
                                    <Link to="/login" className="underline hover:text-neutral-800">
                                        Log in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={submitVerify} className="space-y-4">
                            <label className="block text-xs font-medium text-neutral-600">
                                Enter the 6-digit code sent to {form.email}
                            </label>

                            <OTPInput value={otp} onChange={(v) => setOtp(v)} length={6} />

                            {err && <div className="text-sm text-red-600">{err}</div>}

                            <button
                                type="submit"
                                disabled={loading || otp.replace(/\D/g, "").length !== 6}
                                className="w-full rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {loading ? "Verifying…" : "Verify & Create account"}
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await registerStart(form); // resend code
                                    } catch (e) {
                                        setErr(e?.message || "Couldn’t resend code");
                                    }
                                }}
                                className="w-full text-sm underline text-neutral-600 hover:text-neutral-800"
                            >
                                Resend code
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
