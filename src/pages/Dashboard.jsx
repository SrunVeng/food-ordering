import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useGroups } from "../store/group.js";
import { motion } from "framer-motion";
import { Clock, Plus, Users } from "lucide-react";

export default function Dashboard() {
    const { user } = useAuth();
    const { loading, groups, restaurants, bootstrap, createGroup } = useGroups();
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [deadlineMin, setDeadlineMin] = useState(60); // default 1h ahead

    useEffect(() => { bootstrap(); }, [bootstrap]);

    const create = async () => {
        if (!name || !restaurantId) return;
        const deadlineAt = Date.now() + deadlineMin * 60_000;
        const g = await createGroup({
            name, restaurantId, ownerId: user.id, deadlineAt
        });
        setCreating(false);
        setName(""); setRestaurantId(""); setDeadlineMin(60);
        // optional: navigate to group page…
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Groups</h1>
                <button className="btn btn-primary" onClick={() => setCreating(true)}>
                    <Plus className="size-4" /> New Group
                </button>
            </div>

            {creating && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                        <input className="input" placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} />
                        <select className="input" value={restaurantId} onChange={e=>setRestaurantId(e.target.value)}>
                            <option value="">Select restaurant</option>
                            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-neutral-500" />
                            <input
                                type="number" min={10} step={5}
                                className="input"
                                value={deadlineMin}
                                onChange={e=>setDeadlineMin(Number(e.target.value))}
                                placeholder="Deadline minutes (default 60)"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button className="btn btn-primary" onClick={create}>Create</button>
                        <button className="btn btn-ghost" onClick={()=>setCreating(false)}>Cancel</button>
                    </div>
                </motion.div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card p-4 animate-pulse h-28" />
                    ))
                ) : groups.length === 0 ? (
                    <div className="text-neutral-600">No groups yet. Create one!</div>
                ) : (
                    groups.map(g => <GroupCard key={g.id} g={g} />)
                )}
            </div>
        </div>
    );
}

function GroupCard({ g }) {
    const { restaurants } = useGroups();
    const restaurant = useMemo(() => restaurants.find(r => r.id === g.restaurantId), [restaurants, g.restaurantId]);
    const deadlineLeft = Math.max(0, g.deadlineAt - Date.now());
    const mins = Math.floor(deadlineLeft / 60000);

    return (
        <motion.div whileHover={{ y: -2 }} className="card p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-sm text-neutral-600">{restaurant?.name || "—"}</div>
                </div>
                <div className="text-sm text-neutral-600 flex items-center gap-1">
                    <Users className="size-4" /> {g.members?.length || 0}
                </div>
            </div>

            <div className="mt-2 text-sm text-neutral-600 flex items-center gap-2">
                <Clock className="size-4" />
                {mins > 0 ? `${mins} min left` : "Deadline passed"}
            </div>

            <div className="mt-3">
                <Link to={`/groups/${g.id}`} className="btn btn-primary">Open</Link>
            </div>
        </motion.div>
    );
}
