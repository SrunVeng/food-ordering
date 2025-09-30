import { create } from "zustand";
import { loginApi, registerApi } from "../lib/api";

export const useAuth = create((set, get) => ({
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user") || "null"),

    async login({ username, password }) {
        const { token, user } = await loginApi({ username, password });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ token, user });
    },

    async register({ username, password }) {
        await registerApi({ username, password });
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: "", user: null });
    }
}));
