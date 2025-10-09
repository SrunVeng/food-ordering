import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { fetchMyProfile, updateAccountApi, updateAccountVerifyApi, deleteAccountApi } from "../lib/api.js";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/** Convert arbitrary date strings to YYYY-MM-DD for <input type="date"> */
function toDateInputValue(d) {
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const iso = Date.parse(d);
    if (!Number.isNaN(iso)) {
        const dt = new Date(iso);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    const dmY = d.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (dmY) {
        const [, dd, mm, yyyy] = dmY;
        return `${yyyy}-${mm}-${dd}`;
    }
    const YmD = d.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
    if (YmD) {
        const [, yyyy, mm, dd] = YmD;
        return `${yyyy}-${mm}-${dd}`;
    }
    return "";
}

/** return only fields that actually changed (and are not undefined) */
function diffPayload(original, current) {
    const out = {};
    for (const k of Object.keys(current)) {
        if (k === "username") continue; // username is read-only (server uses JWT)
        if (current[k] === undefined) continue;
        if ((original?.[k] ?? "") !== (current?.[k] ?? "")) out[k] = current[k];
    }
    return out;
}

export default function Profile() {
    const { user, logout } = useAuth();
    const username = user?.username;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [editing, setEditing] = useState(false);

    // keep a copy of the loaded data for diffing
    const [original, setOriginal] = useState(null);

    const [form, setForm] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        gender: "",
        dob: "",
    });

    // OTP modal state
    const [otpOpen, setOtpOpen] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpErr, setOtpErr] = useState("");
    const [otpSaving, setOtpSaving] = useState(false);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    useEffect(() => {
        let mounted = true;
        async function load() {
            setErr("");
            setLoading(true);
            try {
                const data = await fetchMyProfile(); // server decides username via JWT
                if (!mounted) return;

                const gender = data?.gender ?? data?.sex ?? data?.genderCode ?? "";
                const rawDob =
                    data?.dob ?? data?.dateOfBirth ?? data?.birthDate ?? data?.birthday ?? "";

                const next = {
                    username: data?.username || user?.username || username || "",
                    firstName: data?.firstName || "",
                    lastName: data?.lastName || "",
                    email: data?.email || "",
                    phoneNumber: data?.phoneNumber || "",
                    gender,
                    dob: toDateInputValue(rawDob),
                };
                setForm(next);
                setOriginal(next);
            } catch (e) {
                if (!mounted) return;
                setErr(e.message || "Failed to load profile");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [user?.username]);

    async function onSave(e) {
        e?.preventDefault?.();
        setErr("");
        setSaving(true);
        try {
            // only send what changed
            const payload = diffPayload(original, form);

            // no changes → no-op
            if (Object.keys(payload).length === 0) {
                setEditing(false);
                return;
            }

            const res = await updateAccountApi(payload);

            // Detect if email change requires OTP.
            // Prefer backend flags, but fall back to client-side check.
            const emailChanged = (original?.email ?? "") !== (form?.email ?? "");
            const otpRequired =
                res?.emailOtpRequired ??
                res?.otpRequired ??
                res?.emailVerificationRequired ??
                (emailChanged && true);

            const targetEmail =
                res?.email ??
                res?.pendingEmail ??
                res?.emailTarget ??
                (emailChanged ? form.email : "");

            if (otpRequired && targetEmail) {
                // open OTP modal
                setOtpEmail(targetEmail);
                setOtpCode("");
                setOtpErr("");
                setOtpOpen(true);
            } else {
                // nothing special; commit locally
                setOriginal(form);
                setEditing(false);
            }
        } catch (e) {
            setErr(e.message || "Failed to update");
        } finally {
            setSaving(false);
        }
    }

    async function onVerifyOtp(e) {
        e?.preventDefault?.();
        if (!otpEmail || !otpCode) {
            setOtpErr("Enter the 6-digit code we sent.");
            return;
        }
        setOtpErr("");
        setOtpSaving(true);
        try {
            await updateAccountVerifyApi({ email: otpEmail, otp: otpCode });

            // success: treat email as committed
            const next = { ...form, email: otpEmail };
            setForm(next);
            setOriginal(next);

            setOtpOpen(false);
            setEditing(false);
        } catch (e) {
            setOtpErr(e.message || "Verification failed");
        } finally {
            setOtpSaving(false);
        }
    }

    async function onDelete() {
        if (!username) return;
        const yes = window.confirm("Delete your account? This cannot be undone.");
        if (!yes) return;
        try {
            await deleteAccountApi({ username });
            await logout();
            navigate("/login", { replace: true });
        } catch (e) {
            setErr(e.message || "Failed to delete account");
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
                <div className="text-neutral-600 text-sm">Loading profile…</div>
            </div>
        );
    }

    const emailWillChange = (original?.email ?? "") !== (form?.email ?? "");

    return (
        <div className="min-h-screen bg-neutral-50 px-4">
            <div className="mx-auto max-w-2xl py-4">
                <div className="mb-4">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800">
                        <ArrowLeft size={16} /> Back
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white p-6 shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-semibold">My Profile</h1>
                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100"
                            >
                                <Pencil size={16} /> Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setForm(original); setEditing(false); }}
                                    className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-md bg-neutral-900 text-white px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    <Save size={16} /> {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        )}
                    </div>

                    {err && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}

                    {/* If email changed during edit, give the user a heads-up */}
                    {editing && emailWillChange && (
                        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
                            You changed your email. We’ll send a 6-digit verification code to the new address after you click Save.
                        </div>
                    )}

                    <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Username (read-only) */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Username</label>
                            <input
                                name="username"
                                value={form.username}
                                readOnly
                                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">First name</label>
                            <input
                                name="firstName"
                                value={form.firstName}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Last name</label>
                            <input
                                name="lastName"
                                value={form.lastName}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
                            <input
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={form.gender || ""}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50 bg-white"
                            >
                                <option value="">Select</option>
                                <option value="F">F</option>
                                <option value="M">M</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Date of birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={form.dob || ""}
                                onChange={onChange}
                                disabled={!editing}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                        </div>
                    </form>

                    <div className="mt-6">
                        <button
                            onClick={onDelete}
                            className="inline-flex items-center gap-2 rounded-md border border-red-300 text-red-700 bg-white px-3 py-1.5 text-sm hover:bg-red-50"
                        >
                            <Trash2 size={16} /> Delete Account
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* OTP Modal */}
            {otpOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow">
                        <div className="text-sm text-neutral-700">
                            We sent a 6-digit code to <span className="font-medium">{otpEmail}</span>.
                            Enter it below to confirm your new email.
                        </div>

                        {otpErr && <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{otpErr}</div>}

                        <form className="mt-3" onSubmit={onVerifyOtp}>
                            <input
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-center tracking-widest text-lg"
                                placeholder="••••••"
                            />
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOtpOpen(false)}
                                    className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={otpSaving || otpCode.length !== 6}
                                    className="rounded-md bg-neutral-900 text-white px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {otpSaving ? "Verifying…" : "Verify"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
