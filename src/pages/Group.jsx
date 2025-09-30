import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useGroups } from "../store/group.js";
import RestaurantPicker from "../compoents/RestaurantPicker.jsx";
import DishGrid from "../compoents/DishGrid.jsx";
import { motion } from "framer-motion";
import { CheckCircle2, Crown, Plus, Send, Users } from "lucide-react";

export default function GroupPage() {
    const { groupId } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const { groups, restaurants, menuMap, joinGroup, addDish, submit, bootstrap } = useGroups();
    const [selectedRestaurant, setSelectedRestaurant] = useState("");
    const [mySelections, setMySelections] = useState({});

    useEffect(() => { if (!groups.length) bootstrap(); }, [groups.length, bootstrap]);

    const g = useMemo(() => groups.find(x => x.id === groupId), [groups, groupId]);
    useEffect(() => { if (g) setSelectedRestaurant(g.restaurantId) }, [g]);

    if (!g) return <div className="text-neutral-600">Group not found.</div>;

    const isOwner = g.ownerId === user.id;
    const isMember = g.members?.includes(user.id);
    const dishes = menuMap[selectedRestaurant] || [];

    const orderLeft = Math.max(0, g.deadlineAt - Date.now());
    const orderOpen = orderLeft > 0;

    const total = useMemo(() => {
        const entries = Object.entries(mySelections);
        return entries.reduce((sum, [dishId, qty]) => {
            const d = dishes.find(x => x.id === dishId);
            return sum + (d ? d.price * qty : 0);
        }, 0);
    }, [mySelections, dishes]);

    const handleJoin = async () => {
        await joinGroup(g.id, user.id);
    };

    const handleQty = (dishId, qty) => {
        setMySelections(prev => {
            const next = { ...prev };
            if (qty <= 0) delete next[dishId];
            else next[dishId] = qty;
            return next;
        });
    };

    const saveMyDishes = async () => {
        const entries = Object.entries(mySelections);
        for (const [dishId, qty] of entries) {
            const current = g?.dishes?.[user.id]?.[dishId] || 0;
            const delta = qty - current;
            if (delta !== 0) {
                await addDish({ groupId: g.id, userId: user.id, dishId, qty: delta });
            }
        }
    };

    const submitOrder = async () => {
        if (!isOwner) return;
        // Backend push/Telegram will be handled in your API later.
        await submit({ groupId: g.id, userId: user.id });
        nav("/");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold">{g.name}</h1>
                    <div className="text-sm text-neutral-600 flex items-center gap-2">
                        <Users className="size-4" /> {g.members?.length || 0} members
                        {isOwner && (<span className="inline-flex items-center gap-1 text-blue-700">
              <Crown className="size-4" /> Owner
            </span>)}
                    </div>
                </div>
                <div className="text-sm text-neutral-600">
                    {orderOpen ? `${Math.floor(orderLeft/60000)} min left` : "Deadline passed"}
                </div>
            </div>

            {!isMember && (
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    onClick={handleJoin}
                >
                    <Plus className="size-4" /> Join Group
                </motion.button>
            )}

            <section className="space-y-3">
                <h2 className="font-medium">Restaurant</h2>
                <RestaurantPicker
                    restaurants={restaurants}
                    value={selectedRestaurant}
                    onChange={() => {}}
                />
                <div className="text-xs text-neutral-500">
                    (Restaurant is fixed by group owner when creating the group)
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="font-medium">Pick your dishes</h2>
                <DishGrid dishes={dishes} selections={mySelections} onChangeQty={handleQty} />
                <div className="flex items-center justify-between gap-3">
                    <div className="text-neutral-700">
                        <span className="font-medium">Total:</span> ${total.toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.98 }} className="btn btn-ghost" onClick={() => setMySelections({})}>
                            Reset
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.98 }} className="btn btn-primary" onClick={saveMyDishes} disabled={!orderOpen || !isMember}>
                            <CheckCircle2 className="size-4" /> Save Choices
                        </motion.button>
                    </div>
                </div>
            </section>

            <section className="flex items-center justify-between">
                <div className="text-sm text-neutral-600">
                    Only the group owner can submit the final order.
                </div>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    disabled={!isOwner || !orderOpen}
                    onClick={submitOrder}
                    title="Owner submits (your backend will push to Telegram)"
                >
                    <Send className="size-4" /> Submit Order
                </motion.button>
            </section>
        </div>
    );
}
