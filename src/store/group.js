import { create } from "zustand";
import {
    fetchGroupsApi,
    fetchRestaurantsApi,
    createGroupApi,
    joinGroupApi,
    addDishApi,
    submitGroupApi,
    deleteGroupApi,
} from "../lib/api";

export const useGroups = create((set, get) => ({
    loading: false,
    error: "",
    groups: [],
    restaurants: [],
    menuMap: {},

    /** Load groups + restaurants (idempotent) */
    async bootstrap() {
        set({ loading: true, error: "" });
        try {
            const [groups, rest] = await Promise.all([
                fetchGroupsApi(),
                fetchRestaurantsApi(),
            ]);
            set({
                groups,
                restaurants: rest.restaurants,
                menuMap: rest.menuMap,
                loading: false,
            });
        } catch (e) {
            set({ error: e?.message || "Failed to bootstrap.", loading: false });
        }
    },

    /** Create a new group; prepend to list and return it */
    async createGroup(payload /* { name, restaurantId, ownerId, ownerName?, deadlineAt } */) {
        const g = await createGroupApi(payload);
        set({ groups: [g, ...get().groups] });
        return g;
    },

    /** Join a group; updates the matching group in state
     *  username is optional, but helps show names immediately.
     */
    async joinGroup(groupId, userId, username) {
        const g = await joinGroupApi({ groupId, userId, username });
        set({ groups: get().groups.map((x) => (x.id === g.id ? g : x)) });
        return g;
    },

    /** Add a dish delta (qty can be +/-, 0 removes) */
    async addDish({ groupId, userId, dishId, qty }) {
        const g = await addDishApi({ groupId, userId, dishId, qty });
        set({ groups: get().groups.map((x) => (x.id === g.id ? g : x)) });
        return g;
    },

    /** Submit order (owner only). We also mirror submittedAt locally for instant UI. */
    async submit({ groupId, userId }) {
        await submitGroupApi({ groupId, userId });
        const now = Date.now();
        set({
            groups: get().groups.map((g) =>
                g.id === groupId ? { ...g, submittedAt: now } : g
            ),
        });
    },

    /** Delete group (owner only in UI). */
    async deleteGroup(id) {
        set({ loading: true, error: "" });
        try {
            await deleteGroupApi(id);
            set((s) => ({
                groups: s.groups.filter((g) => g.id !== id),
                loading: false,
            }));
        } catch (e) {
            set({ error: e?.message || "Failed to delete group.", loading: false });
            throw e;
        }
    },
}));
