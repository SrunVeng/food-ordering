import { useUI } from '../store/ui.js'

export function LoadingOverlay() {
    const loading = useUI((s) => s.loading)
    if (!loading) return null
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm">
            <div className="card w-64 text-center">
                <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
                <div className="font-medium">Loading…</div>
            </div>
        </div>
    )
}
