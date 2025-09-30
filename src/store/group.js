import { create } from "zustand";
import {
    fetchGroupsApi, createGroupApi, joinGroupApi,
    addDishApi, submitGroupApi, fetchRestaurantsApi
} from "../lib/api";

export const useGroups = create((set, get) => ({
    loading: false,
    groups: [],
    restaurants: [],
    menuMap: {},

    async bootstrap() {
        set({ loading: true });
        const [groups, rest] = await Promise.all([fetchGroupsApi(), fetchRestaurantsApi()]);
        set({ groups, restaurants: rest.restaurants, menuMap: rest.menuMap, loading: false });
    },

    async createGroup(payload) {
        const g = await createGroupApi(payload);
        set({ groups: [g, ...get().groups] });
        return g;
    },

    async joinGroup(groupId, userId) {
        const g = await joinGroupApi({ groupId, userId });
        set({ groups: get().groups.map(x => x.id === g.id ? g : x) });
    },

    async addDish({ groupId, userId, dishId, qty }) {
        const g = await addDishApi({ groupId, userId, dishId, qty });
        set({ groups: get().groups.map(x => x.id === g.id ? g : x) });
    },

    async submit({ groupId, userId }) {
        await submitGroupApi({ groupId, userId });
    }
}));
