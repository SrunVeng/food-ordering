import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const api = useMemo(() => ({
        show(msg, opts = {}) {
            const id = crypto.randomUUID()
            setToasts(t => [...t, { id, msg, type: opts.type || 'info', timeout: opts.timeout ?? 2400 }])
            return id
        },
        dismiss(id) {
            setToasts(t => t.filter(x => x.id !== id))
        }
    }), [])

    useEffect(() => {
        const timers = toasts.map(t => setTimeout(() => api.dismiss(t.id), t.timeout))
        return () => timers.forEach(clearTimeout)
    }, [toasts, api])

    return (
        <ToastCtx.Provider value={api}>
            {children}
            {createPortal(
                <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
                    {toasts.map(t => (
                        <div key={t.id} className="card min-w-64 shadow-md border-[var(--color-primary)]">
                            <div className="text-sm">{t.msg}</div>
                        </div>
                    ))}
                </div>,
                document.getElementById('portal-root')
            )}
        </ToastCtx.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastCtx)
    if (!ctx) throw new Error('ToastProvider missing')
    return ctx
}
