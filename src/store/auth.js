import { create } from "zustand";
import { loginApi, registerApi } from "../lib/api.js";

export const useAuth = create((set, get) => ({
    token: localStorage.getItem("accessToken") || "",
    refreshToken: localStorage.getItem("refreshToken") || "",

    async login({ username, password }) {
        const { accessToken, refreshToken, user } = await loginApi({ username, password });

        // Persist
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken || "");
        if (user) localStorage.setItem("user", JSON.stringify(user));

        set({ token: accessToken, refreshToken: refreshToken || "", user: user || null });
    },

    async register({ firstName, lastName, username, password, confirmPassword, phoneNumber, email }) {
        await registerApi({ firstName, lastName, username, password, confirmPassword, phoneNumber, email });
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        set({ token: "", refreshToken: "", user: null });
    }
}));
