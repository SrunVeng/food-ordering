import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const nav = useNavigate();
    const { login, register } = useAuth();

    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const doLogin = async (e) => {
        e.preventDefault();
        setErr(""); setLoading(true);
        try {
            await login({ username, password });
            nav("/");
        } catch (e) { setErr(e.message || "Login failed"); }
        finally { setLoading(false); }
    };

    const doRegister = async () => {
        setErr(""); setLoading(true);
        try { await register({ username, password }); }
        catch (e) { setErr(e.message || "Register failed"); }
        finally { setLoading(false); }
    };

    return (
        <div className="mx-auto max-w-md pt-10">
            <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card p-6"
            >
                <h1 className="text-xl font-semibold">Sign in</h1>
                <p className="text-sm text-neutral-600 mt-1">Username & password only.</p>

                <form onSubmit={doLogin} className="mt-6 space-y-4">
                    <div>
                        <label className="label">Username</label>
                        <div className="relative">
                            <User className="size-4 absolute left-3 top-3 text-neutral-500" />
                            <input className="input pl-9" value={username} onChange={e=>setU(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <div className="relative">
                            <Lock className="size-4 absolute left-3 top-3 text-neutral-500" />
                            <input type="password" className="input pl-9" value={password} onChange={e=>setP(e.target.value)} />
                        </div>
                    </div>

                    {err && <div className="text-sm text-red-600">{err}</div>}

                    <div className="flex gap-2">
                        <button className="btn btn-primary w-full" disabled={loading}>
                            {loading ? "Please wait..." : "Login"}
                        </button>
                        <button
                            type="button"
                            onClick={doRegister}
                            className="btn btn-ghost w-36"
                            disabled={loading}
                            title="Register a new account"
                        >
                            Register
                        </button>
                    </div>

                    <div className="text-xs text-neutral-500 text-center mt-2">
                        {/* When your API is ready, replace login/register in src/lib/api.js */}
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
