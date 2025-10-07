import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
    const nav = useNavigate();
    const { register: doRegister } = useAuth();

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

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
    const requiredFilled =
        form.firstName && form.lastName && form.username && form.password && form.phoneNumber;
    const canSubmit = requiredFilled && !pwMismatch;

    const submit = async (e) => {
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
            await doRegister(form);
            nav("/login", { state: { msg: "Account created. You can now log in." }, replace: true });
        } catch (e) {
            setErr(e.message || "Register failed");
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
                    <h1 className="text-lg font-semibold mb-4">Create your account</h1>

                    {err && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {err}
                        </div>
                    )}

                    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                />
                            </div>
                        </div>

                        {/* Email (optional) */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Email (optional)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={onChange}
                                    autoComplete="email"
                                    className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                                    placeholder="you@example.com"
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
                                {loading ? "Creating account…" : "Create account"}
                            </button>

                            <p className="text-center text-sm text-neutral-600">
                                Already have an account?{" "}
                                <Link to="/login" className="underline hover:text-neutral-800">Log in</Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
