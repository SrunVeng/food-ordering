// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    Plus,
    Users,
    X,
    Trash2,
    FolderPlus,
    MapPin,
    Crown,
    ArrowRight,
    ExternalLink,
} from "lucide-react";

import { useAuth } from "../store/auth";
import { useGroups } from "../store/group.js";

import { Button } from "../ui/Button.jsx";
import { useConfirm } from "../components/ConfirmGuard.jsx";
import { useToast } from "../ui/toast/ToastContext.jsx";
import MapPicker from "../components/MapPicker.jsx";

/* -------------------------------------------
   Dashboard (Create flow + Groups grid)
-------------------------------------------- */
export default function Dashboard() {
    const nav = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const { loading, groups, restaurants, bootstrap, createGroup, deleteGroup } = useGroups();

    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [deadlineMin, setDeadlineMin] = useState(60);
    const [meeting, setMeeting] = useState(null); // { lat, lng, label }
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
        if (!meeting?.lat || !meeting?.lng) return setError("Please pin a meeting place on the map.");

        setBusy(true);
        try {
            const deadlineAt = Date.now() + deadlineMin * 60_000;
            const g = await createGroup({
                name: name.trim(),
                restaurantId,
                ownerId: user.id,
                ownerName: user.username,
                deadlineAt,
                meeting, // { lat, lng, label }
            });
            toast.show("Group created.", { type: "info" });
            setCreating(false);
            setName("");
            setRestaurantId("");
            setDeadlineMin(60);
            setMeeting(null);
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
                            <Button
                                variant="ghost"
                                className="!p-0 size-8 grid place-items-center"
                                onClick={() => setCreating(false)}
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <div className="mt-3 grid gap-3">
                            {/* Inputs row */}
                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                    <label className="text-xs text-neutral-600">Group name</label>
                                    <input
                                        className="input"
                                        placeholder="e.g., Friday Pho Squad"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-xs text-neutral-600">Restaurant</label>
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
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-xs text-neutral-600 inline-flex items-center gap-1">
                                        <Clock className="size-3.5" />
                                        Deadline (minutes)
                                    </label>
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

                            {/* Meeting map picker */}
                            <div className="grid gap-1">
                                <label className="text-xs text-neutral-600 inline-flex items-center gap-1">
                                    <MapPin className="size-3.5" />
                                    Meeting / gathering place
                                </label>
                                <MapPicker purpose="meeting" value={meeting} onChange={setMeeting} />
                                <div className="text-xs text-neutral-500">
                                    This pin is where participants gather. It is <span className="font-medium">not</span> the restaurant
                                    location.
                                </div>
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
                        <div key={i} className="rounded-2xl border bg-white p-4 h-36 animate-pulse" />
                    ))
                ) : groups.length === 0 ? (
                    <EmptyState />
                ) : (
                    groups.map((g) => (
                        <GroupCard
                            key={g.id}
                            g={g}
                            currentUserId={user.id}
                            restaurants={restaurants}
                            onDelete={deleteGroup}
                            onOpen={() => nav(`/groups/${g.id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------
   Empty State
-------------------------------------------- */
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

/* -------------------------------------------
   Redesigned Group Card
-------------------------------------------- */
function GroupCard({ g, currentUserId, restaurants, onDelete, onOpen }) {
    const toast = useToast();
    const confirm = useConfirm();

    const [now, setNow] = useState(Date.now());
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(t);
    }, []);

    const isOwner = g.ownerId === currentUserId;
    const meeting = g.meeting || g.meetingPlace || null;

    const restaurantName = useMemo(() => {
        const r = restaurants.find((r) => r.id === g.restaurantId);
        return r?.name || "—";
    }, [restaurants, g.restaurantId]);

    const leftMs = Math.max(0, (g.deadlineAt || 0) - now);
    const mins = Math.floor(leftMs / 60000);
    const pctHour = Math.max(0, Math.min(100, 100 - (leftMs / (60 * 60 * 1000)) * 100));
    const isOpen = leftMs > 0;

    const statusChip = isOpen ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[12px] text-emerald-700">
      <Clock className="size-3.5" />
            {mins > 0 ? `${mins} min left` : "< 1 min left"}
    </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[12px] text-neutral-600">
      Closed
    </span>
    );

    function osmLink() {
        if (!meeting?.lat || !meeting?.lng) return "#";
        return `https://www.openstreetmap.org/?mlat=${meeting.lat}&mlon=${meeting.lng}#map=17/${meeting.lat}/${meeting.lng}`;
    }

    async function handleDelete() {
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
            await onDelete(g.id);
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
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="font-semibold truncate">{g.name}</div>
                        {isOwner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-[12px] text-[var(--color-primary-700)]">
                <Crown className="size-3.5" />
                Owner
              </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-sm text-neutral-600 truncate">{restaurantName}</div>
                </div>

                {/* Status chip */}
                <div className="shrink-0">{statusChip}</div>
            </div>

            {/* Meta row */}
            <div className="mt-3 text-sm text-neutral-600 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="inline-flex items-center gap-1">
                    <Users className="size-4" />
                    {g.members?.length || 0} members
                </div>

                {meeting?.lat && meeting?.lng && (
                    <div className="inline-flex items-center gap-1 min-w-0">
                        <MapPin className="size-4" />
                        <span className="truncate">
              {meeting.label ? meeting.label : `${meeting?.lat.toFixed(5)}, ${meeting?.lng.toFixed(5)}`}
            </span>
                        <a
                            href={osmLink()}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 inline-flex items-center gap-1 text-xs text-[var(--color-primary-700)] hover:underline"
                            title="Open in OpenStreetMap"
                        >
                            <ExternalLink className="size-3.5" />
                            OSM
                        </a>
                    </div>
                )}
            </div>

            {/* Deadline progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100" title="Time left">
                <div
                    className={`h-full transition-[width] ${
                        isOpen ? "bg-neutral-800" : "bg-neutral-300"
                    }`}
                    style={{ width: `${pctHour}%` }}
                    aria-hidden
                />
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between gap-2">
                <Button onClick={onOpen} className="inline-flex items-center gap-1">
                    Open <ArrowRight className="size-4" />
                </Button>

                <div className="flex items-center gap-2">
                    {isOwner && (
                        <Button
                            onClick={handleDelete}
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
            </div>
        </motion.div>
    );
}
