// src/components/ConfirmGuard.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Button } from "../ui/Button.jsx";

const ConfirmCtx = createContext(null);

/**
 * Call inside your app root. Gives you useConfirm() anywhere.
 */
export function ConfirmProvider({ children }) {
    const [stack, setStack] = useState([]); // supports multiple queued confirms

    const api = useMemo(() => {
        function confirm(opts = {}) {
            return new Promise((resolve) => {
                const id = crypto.randomUUID();
                const item = {
                    id,
                    title: opts.title ?? "Are you sure?",
                    body: opts.body ?? "Please confirm this action.",
                    confirmText: opts.confirmText ?? "Confirm",
                    cancelText: opts.cancelText ?? "Cancel",
                    tone: opts.tone ?? "neutral", // "neutral" | "danger" | "primary"
                    onResolve: resolve,
                };
                setStack((s) => [...s, item]);
            });
        }
        function resolveTop(value) {
            setStack((s) => {
                const last = s[s.length - 1];
                if (last) last.onResolve(value);
                return s.slice(0, -1);
            });
        }
        return { confirm, resolveTop };
    }, []);

    const current = stack[stack.length - 1];

    return (
        <ConfirmCtx.Provider value={api}>
            {children}
            {createPortal(
                <AnimatePresence>
                    {current && (
                        <motion.div
                            key={current.id}
                            className="fixed inset-0 z-[60] grid place-items-center bg-black/30 backdrop-blur-sm px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-label={current.title}
                                className="w-full max-w-md rounded-2xl border bg-white shadow-xl"
                                initial={{ y: 16, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 8, opacity: 0 }}
                            >
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold tracking-tight">
                                        {current.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-neutral-600">{current.body}</p>

                                    <div className="mt-4 h-px bg-neutral-100" />

                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => api.resolveTop(false)}
                                        >
                                            {current.cancelText}
                                        </Button>
                                        <Button
                                            className={clsx(
                                                current.tone === "danger" && "ring-1 ring-red-200",
                                                "min-w-24"
                                            )}
                                            variant={current.tone === "danger" ? "primary" : "primary"}
                                            onClick={() => api.resolveTop(true)}
                                        >
                                            {current.confirmText}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById("portal-root")
            )}
        </ConfirmCtx.Provider>
    );
}

/**
 * Get a function you can await:
 * const confirm = useConfirm();
 * const ok = await confirm({ title, body, tone: "danger" })
 */
export function useConfirm() {
    const ctx = useContext(ConfirmCtx);
    if (!ctx) throw new Error("ConfirmProvider missing");
    return ctx.confirm;
}
