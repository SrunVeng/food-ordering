import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

const ToastCtx = createContext(null);

const typeMeta = {
    success: {
        icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
        ring: "ring-green-200",
        bg: "bg-green-600",
    },
    error: {
        icon: <XCircle className="h-5 w-5" aria-hidden="true" />,
        ring: "ring-red-200",
        bg: "bg-red-600",
    },
    warning: {
        icon: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
        ring: "ring-amber-200",
        bg: "bg-amber-600",
    },
    info: {
        icon: <Info className="h-5 w-5" aria-hidden="true" />,
        ring: "ring-blue-200",
        bg: "bg-blue-600",
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const api = useMemo(
        () => ({
            show(msg, opts = {}) {
                const id = crypto.randomUUID();
                const type = opts.type || "info";
                const timeout = opts.timeout ?? 2400;
                const action = opts.action || null; // { label, onClick }
                setToasts((t) => [...t, { id, msg, type, timeout, action }]);
                return id;
            },
            dismiss(id) {
                setToasts((t) => t.filter((x) => x.id !== id));
            },
            clearAll() {
                setToasts([]);
            },
        }),
        []
    );

    useEffect(() => {
        const timers = toasts.map((t) => setTimeout(() => api.dismiss(t.id), t.timeout));
        return () => timers.forEach(clearTimeout);
    }, [toasts, api]);

    return (
        <ToastCtx.Provider value={api}>
            {children}
            {createPortal(
                <div className="fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
                    {toasts.map((t) => {
                        const meta = typeMeta[t.type] || typeMeta.info;
                        return (
                            <div
                                key={t.id}
                                className={`group relative w-80 rounded-xl border border-neutral-200 bg-white/95 backdrop-blur p-3 shadow-lg ring-2 ${meta.ring} 
                data-[enter]:animate-[toast-in_200ms_ease-out] data-[leave]:animate-[toast-out_200ms_ease-in]`}
                                data-enter=""
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`grid size-7 place-items-center rounded-full text-white ${meta.bg}`}>
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 text-sm text-neutral-900">{t.msg}</div>

                                    <button
                                        onClick={() => api.dismiss(t.id)}
                                        className="opacity-70 hover:opacity-100 text-neutral-500 hover:text-neutral-700"
                                        aria-label="Dismiss"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {t.action && (
                                    <button
                                        onClick={() => {
                                            t.action?.onClick?.();
                                            api.dismiss(t.id);
                                        }}
                                        className="mt-2 ml-10 inline-flex items-center rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800"
                                    >
                                        {t.action.label}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>,
                document.getElementById("portal-root")
            )}
        </ToastCtx.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error("ToastProvider missing");
    return ctx;
}

/* mini keyframes (Tailwind arbitrary animations use these data attrs)
@keyframes toast-in { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes toast-out { from { transform: translateY(0); opacity: 1 } to { transform: translateY(8px); opacity: 0 } }
*/
