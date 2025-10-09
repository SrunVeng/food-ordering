import { Link } from "react-router-dom";
import { LogOut, UtensilsCrossed, Search, X } from "lucide-react";
import { useAuth } from "../store/auth";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/toast/ToastContext.jsx";
import { useConfirm } from "../components/ConfirmGuard.jsx";

export default function Header({ onSearch }) {
    const { user, logout } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();

    const name = user?.username || "";
    const role = user?.role || "";
    const initial = name.trim().charAt(0).toUpperCase() || "U";

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [query, setQuery] = useState("");

    const inputMobileRef = useRef(null);

    useEffect(() => {
        function onEsc(e) {
            if (e.key === "Escape") setMobileSearchOpen(false);
        }
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, []);

    useEffect(() => {
        if (mobileSearchOpen) inputMobileRef.current?.focus();
    }, [mobileSearchOpen]);

    function submitSearch(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        onSearch?.(query);
    }

    function toggleMobileSearch(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setMobileSearchOpen((v) => !v);
    }

    async function handleLogoutClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const ok = await confirm({
            title: "Log out?",
            body: "You’ll need to sign in again to place orders or join groups.",
            confirmText: "Yes, log out",
            cancelText: "No, stay",
            tone: "danger",
        });

        if (!ok) return;

        await logout();
        toast.show("You have logged out.", { type: "success", timeout: 2200 });
    }

    return (
        <header
            className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
            role="banner"
        >
            <div className="mx-auto max-w-6xl px-3 sm:px-4">
                {/* Top bar */}
                <div className="h-14 flex items-center justify-between gap-3">
                    {/* Brand */}
                    <Link
                        to="/"
                        className="group inline-flex items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        aria-label="Go to dashboard"
                    >
                        <div className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm transition-all group-hover:shadow group-active:scale-95">
                            <UtensilsCrossed className="h-5 w-5 text-neutral-800" />
                        </div>
                        <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-neutral-900">
                Lunch Groups
              </span>
                        </div>
                    </Link>

                    {/* Right cluster */}
                    <div className="flex items-center gap-2">
                        {/* Mobile search toggle */}
                        <button
                            type="button"
                            onClick={toggleMobileSearch}
                            className="md:hidden grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                        >
                            {mobileSearchOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                        </button>

                        {/* Greeting + role -> link to /profile */}
                        <Link
                            to="/profile"
                            className="hidden md:flex items-center gap-2 pr-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                            aria-label="Open my profile"
                            onClick={(e) => e.stopPropagation()}
                        >
              <span
                  className="grid size-7 place-items-center rounded-full bg-neutral-900 text-white text-[12px] font-medium"
                  aria-hidden="true"
              >
                {initial}
              </span>
                            <span className="max-w-[12rem] truncate text-sm text-neutral-800">
                Hello, <span className="font-medium">{name || "User"}</span>
              </span>
                            {role && (
                                <span className="rounded-full border px-2 py-0.5 text-[11px] text-neutral-700 bg-neutral-50">
                  {role}
                </span>
                            )}
                        </Link>

                        {/* Logout -> opens ConfirmProvider modal */}
                        <button
                            type="button"
                            onClick={handleLogoutClick}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile greeting -> also link to /profile */}
                <div className="md:hidden pb-2 flex items-center justify-between">
                    <Link
                        to="/profile"
                        className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        aria-label="Open my profile"
                        onClick={(e) => e.stopPropagation()}
                    >
            <span className="grid size-7 place-items-center rounded-full bg-neutral-900 text-white text-[12px] font-medium">
              {initial}
            </span>
                        <span className="text-sm text-neutral-800">
              Hello, <span className="font-medium">{name || "User"}</span>
            </span>
                        {role && (
                            <span className="ml-1 rounded-full border px-2 py-0.5 text-[11px] text-neutral-700 bg-neutral-50">
                {role}
              </span>
                        )}
                    </Link>
                </div>

                {/* Mobile search drawer */}
                {mobileSearchOpen && (
                    <div className="md:hidden pb-2" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={submitSearch} role="search" aria-label="Mobile search">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <input
                                    ref={inputMobileRef}
                                    type="search"
                                    inputMode="search"
                                    placeholder="Search restaurants or dishes…"
                                    className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </header>
    );
}
