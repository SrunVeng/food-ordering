import { create } from "zustand";
import {loginApi, registerApi, registerVerifyApi} from "../lib/api.js";
import { decodeJwt, claimsToUser } from "../utils/decoder.js";


const initialAccess = localStorage.getItem("accessToken");
const initialRefresh = localStorage.getItem("refreshToken");
const savedUser = JSON.parse(localStorage.getItem("user"));

const derivedUser = !savedUser && initialAccess ? claimsToUser(decodeJwt(initialAccess)) : null;

export const useAuth = create((set, get) => ({
    token: initialAccess,
    refreshToken: initialRefresh,
    user: savedUser || derivedUser || null,

    async login({ username, password }) {
        const { accessToken, refreshToken, user } = await loginApi({ username, password });
        localStorage.setItem("accessToken", accessToken || "");
        localStorage.setItem("refreshToken", refreshToken || "");
        const fallbackUser = claimsToUser(decodeJwt(accessToken));
        const finalUser = user || fallbackUser || null;
        if (finalUser) localStorage.setItem("user", JSON.stringify(finalUser));

        set({
            token: accessToken || "",
            refreshToken: refreshToken || "",
            accessToken: "",
            user: finalUser,
        });
    },

    async registerStart(payload) {
        return registerApi(payload);
    },

    async registerVerify(payload) {
        return registerVerifyApi(payload);
    },


    logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        set({ token: "", accessToken: "",refreshToken: "", user: null });
    },
}));
