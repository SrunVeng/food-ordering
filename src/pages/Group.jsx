// src/pages/Group.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, CheckCircle2, Crown, Plus, Send, Users, Store, DoorOpen, Save
} from "lucide-react";

import { useAuth } from "../store/auth";
import { useGroups } from "../store/group.js";
import DishGrid from "../components/DishGrid.jsx";
import { Button } from "../ui/Button.jsx";
import { useToast } from "../ui/toast/ToastContext.jsx";
import { useConfirm } from "../components/ConfirmGuard.jsx";
import { applyTheme, theme as defaultTheme } from "../theme.js";

import {
    formatMoney,
    useCountdown,
    useMemberList,
    mergePicks,
    summarizePicksByDish,
    resolveDisplayName,
} from "../utils/utils.js";

export default function GroupPage() {
    const { groupId } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();

    // Apply theme once
    useEffect(() => { applyTheme(defaultTheme); }, []);

    const {
        groups,
        restaurants,
        menuMap,
        joinGroup,
        addDish,
        submit,
        leaveGroup,
        bootstrap,
        usersMap,
    } = useGroups();

    useEffect(() => { if (!groups.length) bootstrap(); }, [groups.length, bootstrap]);

    const g = useMemo(() => groups.find((x) => x.id === groupId), [groups, groupId]);
    const notFound = !g;
    const isOwner = g?.ownerId === user.id;
    const isMember = g?.members?.includes(user.id);

    const restaurant = useMemo(
        () => restaurants.find((r) => r.id === g?.restaurantId),
        [restaurants, g?.restaurantId]
    );
    const dishes = useMemo(() => menuMap[g?.restaurantId] || [], [menuMap, g?.restaurantId]);

    // Countdown
    const { open: orderOpen, min: leftMin, sec: leftSec } = useCountdown(g?.deadlineAt);

    // Local selections
    const [mySelections, setMySelections] = useState({});
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Members
    const memberList = useMemberList({ group: g, usersMap, currentUser: user });
    const AVATAR_LIMIT = 6;
    const avatars = memberList.slice(0, AVATAR_LIMIT);
    const moreCount = Math.max(0, memberList.length - AVATAR_LIMIT);

    // Merge picks & summaries
    const mergedPicks = useMemo(() => mergePicks({
        group: g,
        mySelections,
        isMember,
        currentUserId: user.id
    }), [g, mySelections, isMember, user.id]);

    const picksByDish = useMemo(() => summarizePicksByDish({
        mergedPicks,
        dishes,
        nameResolver: (id) => resolveDisplayName({ userId: id, currentUser: user, usersMap, group: g })
    }), [mergedPicks, dishes, user, usersMap, g]);

    // Pricing
    const total = useMemo(
        () =>
            Object.entries(mySelections).reduce((sum, [dishId, qty]) => {
                const d = dishes.find((x) => x.id === dishId);
                return sum + (d ? d.price * qty : 0);
            }, 0),
        [mySelections, dishes]
    );

    function handleQty(dishId, qty) {
        setMySelections((prev) => {
            const next = { ...prev };
            if (qty <= 0) delete next[dishId];
            else next[dishId] = qty;
            return next;
        });
    }

    async function handleJoin() {
        try {
            await joinGroup(g.id, user.id, user.username);
            toast.show("Joined group.", { type: "info" });
        } catch (e) {
            toast.show(e?.message || "Could not join group.", { type: "error" });
        }
    }

    async function handleLeave() {
        const ok = await confirm({
            title: "Leave this group?",
            body: "You’ll be removed from the member list and your selections won’t be included.",
            confirmText: "Leave group",
            cancelText: "Stay",
            tone: "danger",
        });
        if (!ok) return;

        try {
            if (typeof leaveGroup === "function") {
                await leaveGroup(g.id, user.id);
            } else {
                throw new Error("Leave group not available yet.");
            }
            toast.show("You left the group.", { type: "info" });
            nav("/");
        } catch (e) {
            toast.show(e?.message || "Failed to leave group.", { type: "error" });
        }
    }

    async function saveMyDishes() {
        if (!isMember || !orderOpen) return;
        setSaving(true);
        try {
            const entries = Object.entries(mySelections);
            for (const [dishId, qty] of entries) {
                const current = g?.dishes?.[user.id]?.[dishId] || 0;
                const delta = qty - current;
                if (delta !== 0) {
                    await addDish({ groupId: g.id, userId: user.id, dishId, qty: delta });
                }
            }
            toast.show("Choices saved.", { type: "info" });
        } catch (e) {
            toast.show(e?.message || "Failed to save choices.", { type: "error" });
        } finally {
            setSaving(false);
        }
    }

    async function submitOrder() {
        if (!isOwner || !orderOpen) return;
        const ok = await confirm({
            title: "Submit final order?",
            body: "This will send the order to your backend (e.g., push to Telegram). No more edits after submission.",
            confirmText: "Submit",
            cancelText: "Cancel",
            tone: "primary",
        });
        if (!ok) return;

        setSubmitting(true);
        try {
            await submit({ groupId: g.id, userId: user.id });
            toast.show("Order submitted.", { type: "info" });
            nav("/");
        } catch (e) {
            toast.show(e?.message || "Failed to submit order.", { type: "error" });
        } finally {
            setSubmitting(false);
        }
    }

    if (notFound) {
        return (
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" className="mb-3 -ml-1" onClick={() => nav(-1)}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="rounded-2xl border bg-white p-6 text-neutral-700">Group not found.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card (cleaner design, no ribbon) */}
            <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" className="-ml-2" onClick={() => nav(-1)}>
                                <ArrowLeft className="size-4" /> Back
                            </Button>
                            <h1 className="text-xl font-semibold tracking-tight truncate">{g.name}</h1>
                            {isOwner && (
                                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-[12px] text-[var(--color-primary-700)]">
                  <Crown className="size-3" /> Owner
                </span>
                            )}
                        </div>

                        {/* Members */}
                        <div className="mt-3 flex items-center flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {avatars.map((m) => (
                                        <div
                                            key={m.id}
                                            className="relative z-0 grid size-7 place-items-center rounded-full border border-white bg-neutral-900 text-white text-[11px] font-medium"
                                            title={m.name}
                                            aria-label={m.name}
                                        >
                                            {m.initial}
                                        </div>
                                    ))}
                                    {moreCount > 0 && (
                                        <div
                                            className="grid size-7 place-items-center rounded-full border border-white bg-neutral-200 text-neutral-700 text-[11px] font-medium"
                                            title={`${moreCount} more`}
                                            aria-label={`${moreCount} more`}
                                        >
                                            +{moreCount}
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-neutral-600 flex items-center gap-2">
                                    <Users className="size-4" />
                                    {memberList.length} members
                                </div>
                            </div>

                            <div className="text-xs text-neutral-500 line-clamp-2">
                                Joined:{" "}
                                <span className="text-neutral-700">
                  {memberList
                      .map((m) => (m.id === user.id ? `${m.name} (you)` : m.name))
                      .join(", ")}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Countdown Pill */}
                    <div className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-sm text-neutral-700 tabular-nums shadow-sm">
                        {orderOpen ? `${leftMin}:${String(leftSec).padStart(2, "0")} left` : "Deadline passed"}
                    </div>
                </div>

                {/* Join / Leave CTA */}
                <div className="mt-3">
                    <AnimatePresence initial={false}>
                        {!isMember ? (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Button
                                    onClick={handleJoin}
                                    className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
                                >
                                    <Plus className="size-4" /> Join Group
                                </Button>
                            </motion.div>
                        ) : !isOwner ? (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Button variant="ghost" onClick={handleLeave} className="!text-red-600">
                                    <DoorOpen className="size-4" /> Leave Group
                                </Button>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            {/* Restaurant Card (no hungry button) */}
            <section className="space-y-3">
                <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-neutral-800" />
                    Restaurant
                </h2>

                <div className="rounded-2xl border bg-[var(--color-dish-25)] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="grid size-10 place-items-center rounded-lg border bg-[var(--color-dish-50)] shrink-0">
                            <Store className="size-5 text-neutral-700" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                                {restaurant?.name || "Unknown restaurant"}
                            </div>
                            {restaurant?.note && (
                                <div className="text-xs text-neutral-500 truncate">{restaurant.note}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-xs text-neutral-500">(Set by the group owner when creating the group.)</div>
            </section>

            {/* Dish picker */}
            <section className="space-y-3">
                <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-neutral-800" />
                    Pick your dishes
                </h2>

                <DishGrid dishes={dishes} selections={mySelections} onChangeQty={handleQty} />

                {/* Desktop actions */}
                <div className="hidden sm:flex items-center justify-between gap-3">
                    <div className="text-neutral-700">
                        <span className="font-medium">Your total:</span> {formatMoney(total)}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setMySelections({})} disabled={!orderOpen}>
                            Reset
                        </Button>
                        <Button
                            onClick={saveMyDishes}
                            disabled={!orderOpen || !isMember || saving}
                            className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
                        >
                            {saving ? "Saving…" : (<><Save className="size-4" /> Save Choices</>)}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Group selections summary */}
            <section className="space-y-3">
                <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-neutral-800" />
                    Group selections
                </h2>

                {picksByDish.length === 0 ? (
                    <div className="rounded-2xl border bg-[var(--color-dish-25)] p-4 text-sm text-neutral-500">
                        No selections yet. Once people add dishes, they’ll show here.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {picksByDish.map((row) => (
                            <li key={row.dishId} className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-neutral-900">
                                        {row.name}
                                        {row.price ? (
                                            <span className="ml-2 text-neutral-500 font-normal">
                        ({formatMoney(row.price)})
                      </span>
                                        ) : null}
                                    </div>
                                    <span className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs">
                    {row.total} total
                  </span>
                                </div>
                                <div className="mt-1 text-xs text-neutral-600">
                                    {row.by.map((b) => `${b.name}${b.userId === user.id ? " (you)" : ""} × ${b.qty}`).join(", ")}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="text-xs text-neutral-500">(Shows saved picks + your current unsaved changes.)</div>
            </section>

            {/* Submit (desktop) */}
            <section className="hidden sm:flex items-center justify-between">
                <div className="text-sm text-neutral-600">Only the group owner can submit the final order.</div>
                <Button
                    disabled={!isOwner || !orderOpen || submitting}
                    onClick={submitOrder}
                    title="Owner submits (your backend will push to Telegram)"
                    className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
                >
                    {submitting ? "Submitting…" : (<><Send className="size-4" /> Submit Order</>)}
                </Button>
            </section>

            {/* Sticky mobile action bar */}
            <StickyActions
                orderOpen={orderOpen}
                isMember={isMember}
                isOwner={isOwner}
                saving={saving}
                submitting={submitting}
                total={total}
                onReset={() => setMySelections({})}
                onSave={saveMyDishes}
                onSubmit={submitOrder}
            />
        </div>
    );
}

function StickyActions({ orderOpen, isMember, isOwner, saving, submitting, total, onReset, onSave, onSubmit }) {
    const barRef = useRef(null);
    return (
        <div
            ref={barRef}
            className="sm:hidden sticky bottom-0 inset-x-0 z-30 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70"
        >
            <div className="mx-auto max-w-6xl px-3 py-2 flex items-center justify-between gap-3">
                <div className="text-sm tabular-nums">
                    <span className="font-medium">Total:</span> {formatMoney(total)}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onReset} disabled={!orderOpen}>Reset</Button>
                    <Button
                        onClick={onSave}
                        disabled={!orderOpen || !isMember || saving}
                        className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
                    >
                        {saving ? "Saving…" : (<><CheckCircle2 className="size-4" /> Save</>)}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!isOwner || !orderOpen || submitting}
                        title="Owner submits (your backend will push to Telegram)"
                        className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
                    >
                        {submitting ? "…" : "Submit"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
