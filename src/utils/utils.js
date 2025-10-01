// src/utils.js
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Formatting ---------- */
export function formatMoney(num) {
    const n = Number(num || 0);
    return `$${n.toFixed(2)}`;
}

/* ---------- Time / countdown ---------- */
export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}

export function useCountdown(deadlineAt) {
    const now = useNow(1000);
    const left = Math.max(0, (deadlineAt || 0) - now);
    const open = left > 0;
    const min = Math.floor(left / 60000);
    const sec = Math.floor((left % 60000) / 1000);
    return { left, open, min, sec };
}

/* ---------- Names / members ---------- */
export function resolveDisplayName({ userId, currentUser, usersMap, group }) {
    const md = group?.memberDetails?.find((m) => m.id === userId)?.name;
    if (md) return md;
    const fromMap = usersMap?.[userId]?.username || usersMap?.[userId]?.name;
    if (fromMap) return fromMap;
    if (userId === currentUser.id && (currentUser.username || currentUser.name))
        return currentUser.username || currentUser.name;
    return `User ${String(userId).slice(-4)}`;
}

export function useMemberList({ group, usersMap, currentUser }) {
    const memberIds = group?.members || [];
    // memo with stable deps; stringify id arrays only if necessary
    return useMemo(() => {
        return memberIds.map((id) => {
            const name = resolveDisplayName({ userId: id, currentUser, usersMap, group });
            const initial = (name?.trim?.()[0] || "?").toUpperCase();
            return { id, name, initial };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(memberIds), JSON.stringify(group?.memberDetails || []), usersMap, currentUser.username, currentUser.name]);
}

/* ---------- Picks merging / summaries ---------- */
export function mergePicks({ group, mySelections, isMember, currentUserId }) {
    const base = JSON.parse(JSON.stringify(group?.dishes || {}));
    if (isMember) {
        base[currentUserId] = base[currentUserId] || {};
        for (const [dishId, qty] of Object.entries(mySelections)) {
            if (qty > 0) base[currentUserId][dishId] = qty;
            else delete base[currentUserId][dishId];
        }
    }
    return base;
}

export function summarizePicksByDish({ mergedPicks, dishes, nameResolver }) {
    const map = new Map();
    for (const [uId, dishObj] of Object.entries(mergedPicks)) {
        for (const [dishId, qty] of Object.entries(dishObj || {})) {
            if (!qty) continue;
            const entry = map.get(dishId) || { total: 0, by: [] };
            entry.total += qty;
            entry.by.push({ userId: uId, name: nameResolver(uId), qty });
            map.set(dishId, entry);
        }
    }

    const rows = Array.from(map.entries()).map(([dishId, val]) => {
        const meta = dishes.find((d) => d.id === dishId);
        return {
            dishId,
            name: meta?.name || `#${dishId}`,
            price: meta?.price ?? 0,
            total: val.total,
            by: val.by.sort((a, b) => a.name.localeCompare(b.name)),
        };
    });

    return rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/* ---------- Random picker / lottery ---------- */
/**
 * Fixed spin that truly eases out (no stale interval speed).
 * Returns a controller with start() and stop() to manage the spin.
 *
 * onTick(index) -> called each step with next index
 * onDone(chosenIndex) -> called with final index
 */
export function useSlotSpin(playableCount, { onTick, onDone } = {}) {
    const [spinning, setSpinning] = useState(false);
    const idxRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    function step(remaining, delay) {
        timerRef.current = setTimeout(() => {
            idxRef.current = (idxRef.current + 1) % Math.max(1, playableCount);
            onTick?.(idxRef.current);

            if (remaining <= 1) {
                setSpinning(false);
                onDone?.(idxRef.current);
                return;
            }

            // ease-out: increase delay gradually
            const nextDelay = delay + Math.max(8, Math.floor(delay * 0.08));
            step(remaining - 1, nextDelay);
        }, delay);
    }

    function start() {
        if (spinning || !playableCount) return;
        clearTimeout(timerRef.current);
        setSpinning(true);

        // 32–56 steps feels good
        const totalSteps = 32 + Math.floor(Math.random() * 25);
        const initialDelay = 55; // ms

        step(totalSteps, initialDelay);
    }

    function stop() {
        clearTimeout(timerRef.current);
        setSpinning(false);
    }

    return { spinning, start, stop, indexRef: idxRef };
}
