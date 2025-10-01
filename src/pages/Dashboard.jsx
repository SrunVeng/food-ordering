// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Users, X, Trash2, FolderPlus, Target } from "lucide-react";

import { useAuth } from "../store/auth";
import { useGroups } from "../store/group.js";

import { Button } from "../ui/Button.jsx";
import { useConfirm } from "../components/ConfirmGuard.jsx";
import { useToast } from "../ui/toast/ToastContext.jsx";

export default function Dashboard() {
    const nav = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const { loading, groups, restaurants, bootstrap, createGroup } = useGroups();

    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [deadlineMin, setDeadlineMin] = useState(60);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    async function onCreate() {
        setError("");
        if (!name.trim()) return setError("Please enter a group name.");
        if (!restaurantId) return setError("Please select a restaurant.");
        if (deadlineMin < 5) return setError("Deadline should be at least 5 minutes.");

        setBusy(true);
        try {
            const deadlineAt = Date.now() + deadlineMin * 60_000;
            const g = await createGroup({
                name: name.trim(),
                restaurantId,
                ownerId: user.id,
                ownerName: user.username,
                deadlineAt,
            });
            toast.show("Group created.", { type: "info" });
            setCreating(false);
            setName("");
            setRestaurantId("");
            setDeadlineMin(60);
            nav(`/groups/${g.id}`);
        } catch (e) {
            setError(e?.message || "Failed to create group.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Groups</h1>
                </div>
                <Button onClick={() => setCreating(true)} aria-haspopup="dialog" aria-expanded={creating}>
                    <Plus className="size-4" /> New Group
                </Button>
            </div>

            {/* Create panel */}
            <AnimatePresence>
                {creating && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-2xl border bg-white shadow-sm p-4"
                        role="dialog"
                        aria-label="Create new group"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-base font-medium">Create a lunch group</div>
                            <Button variant="ghost" className="!p-0 size-8 grid place-items-center" onClick={() => setCreating(false)} aria-label="Close">
                                <X className="size-4" />
                            </Button>
                        </div>

                        <div className="mt-3 grid sm:grid-cols-3 gap-3">
                            <input
                                className="input"
                                placeholder="Group name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <select
                                className="input"
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                            >
                                <option value="">Select restaurant</option>
                                {restaurants.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-neutral-500" />
                                <input
                                    type="number"
                                    min={5}
                                    step={5}
                                    className="input w-full"
                                    value={deadlineMin}
                                    onChange={(e) => setDeadlineMin(Number(e.target.value))}
                                    placeholder="Deadline minutes"
                                />
                            </div>
                        </div>

                        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

                        <div className="mt-3 flex gap-2">
                            <Button onClick={onCreate} disabled={busy}>
                                {busy ? "Creating…" : "Create"}
                            </Button>
                            <Button variant="ghost" onClick={() => setCreating(false)}>
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Groups grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border bg-white p-4 h-28 animate-pulse" />
                    ))
                ) : groups.length === 0 ? (
                    <EmptyState />
                ) : (
                    groups.map((g) => <GroupCard key={g.id} g={g} currentUserId={user.id} />)
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="col-span-full">
            <div className="rounded-2xl border bg-white p-6 text-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-lg border bg-neutral-50">
                        <FolderPlus className="size-5 text-neutral-700" />
                    </div>
                    <div>
                        <div className="font-medium">No groups yet</div>
                        <div className="text-sm text-neutral-500">Create your first lunch group to get started.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GroupCard({ g, currentUserId }) {
    const nav = useNavigate();
    const { restaurants, deleteGroup } = useGroups();
    const toast = useToast();
    const confirm = useConfirm();

    const restaurant = useMemo(
        () => restaurants.find((r) => r.id === g.restaurantId),
        [restaurants, g.restaurantId]
    );

    const [now, setNow] = useState(Date.now());
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(t);
    }, []);

    const leftMs = Math.max(0, g.deadlineAt - now);
    const mins = Math.floor(leftMs / 60000);
    const pct = Math.max(0, Math.min(100, 100 - (leftMs / (60 * 60 * 1000)) * 100)); // 0→100 over 60m window
    const isOwner = g.ownerId === currentUserId;

    async function onDelete() {
        if (!isOwner || deleting) return;
        const ok = await confirm({
            title: "Delete this group?",
            body: `“${g.name}” will be permanently removed. This cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            tone: "danger",
        });
        if (!ok) return;

        try {
            setDeleting(true);
            await deleteGroup(g.id);
            toast.show("Group deleted.", { type: "info" });
        } catch (e) {
            toast.show(e?.message || "Failed to delete group.", { type: "error" });
        } finally {
            setDeleting(false);
        }
    }

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-semibold truncate">{g.name}</div>
                    <div className="mt-0.5 text-sm text-neutral-600 truncate">
                        {restaurant?.name || "—"}
                    </div>
                </div>

                {/* Owner-only delete */}
                {isOwner && (
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        className="!text-red-600 !border-red-200 hover:!bg-red-50 disabled:opacity-60"
                        aria-label="Delete group"
                        disabled={deleting}
                    >
                        <Trash2 className="size-4" />
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                )}
            </div>

            <div className="mt-3 text-sm text-neutral-600 flex items-center gap-3">
                <div className="inline-flex items-center gap-1">
                    <Users className="size-4" />
                    {g.members?.length || 0}
                </div>
                <span className="mx-1.5">•</span>
                <div className="inline-flex items-center gap-1">
                    <Clock className="size-4" />
                    {mins > 0 ? `${mins} min left` : "Deadline passed"}
                </div>
            </div>

            {/* Deadline progress */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-neutral-800 transition-[width]" style={{ width: `${pct}%` }} aria-hidden />
            </div>

            <div className="mt-3">
                <Button onClick={() => nav(`/groups/${g.id}`)}>Open</Button>
            </div>
        </motion.div>
    );
}
