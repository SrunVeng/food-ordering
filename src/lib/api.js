// Central API layer: swap mocks with real endpoints later.

// Example real client (commented for now):
// import axios from "axios";
// export const api = axios.create({ baseURL: "http://localhost:4000" });
// api.interceptors.request.use(cfg => {
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// });

/** ---------------- AUTH ---------------- */
export async function loginApi({ username, password }) {
    // TODO: Replace with real call:
    // const res = await api.post('/auth/login', { username, password });
    // const { token, user } = res.data; return { token, user };

    // --- MOCK (comment out when real API is ready) ---
    await wait(400);
    if (!username || !password) throw new Error("Invalid credentials");
    return {
        token: "mock-token-" + Math.random().toString(36).slice(2),
        user: { id: cryptoRandom(), username }
    };
}

export async function registerApi({ username, password }) {
    // TODO: Replace with real call:
    // return api.post('/auth/register', { username, password });
    await wait(400);
    return { ok: true };
}

/** ---------------- GROUPS ---------------- */
export async function fetchGroupsApi() {
    // TODO: Replace with real call:
    // const res = await api.get('/groups');
    // return res.data;

    await wait(200);
    return JSON.parse(localStorage.getItem("groups") || "[]");
}

export async function createGroupApi(payload) {
    // payload: { name, restaurantId, ownerId, deadlineAt }
    // TODO: Replace with real call:
    // const res = await api.post('/groups', payload); return res.data;

    await wait(200);
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const g = { id: cryptoRandom(), members: [payload.ownerId], dishes: {}, ...payload };
    groups.unshift(g);
    localStorage.setItem("groups", JSON.stringify(groups));
    return g;
}

export async function joinGroupApi({ groupId, userId }) {
    // TODO: Replace with real call:
    // return api.post(`/groups/${groupId}/join`, { userId });

    await wait(150);
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error("Group not found");
    if (!g.members.includes(userId)) g.members.push(userId);
    localStorage.setItem("groups", JSON.stringify(groups));
    return g;
}

export async function addDishApi({ groupId, userId, dishId, qty }) {
    // TODO: Replace with real call:
    // return api.post(`/groups/${groupId}/dishes`, { userId, dishId, qty });

    await wait(120);
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error("Group not found");
    g.dishes[userId] = g.dishes[userId] || {};
    g.dishes[userId][dishId] = (g.dishes[userId][dishId] || 0) + qty;
    localStorage.setItem("groups", JSON.stringify(groups));
    return g;
}

export async function submitGroupApi({ groupId, userId }) {
    // Only owner can submit. Backend will push Telegram — you’ll implement.
    // TODO: Replace with real call:
    // return api.post(`/groups/${groupId}/submit`);

    await wait(150);
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error("Group not found");
    if (g.ownerId !== userId) throw new Error("Only owner can submit");
    g.submittedAt = Date.now();
    localStorage.setItem("groups", JSON.stringify(groups));
    return { ok: true };
}

/** ---------------- RESTAURANTS ---------------- */
export async function fetchRestaurantsApi() {
    // Front JSON for now:
    const { RESTAURANTS, DISHES_BY_RESTAURANT } = await import("../mock/data.js");
    return { restaurants: RESTAURANTS, menuMap: DISHES_BY_RESTAURANT };

    // Backend variant (leave commented until ready):
    // const res = await api.get('/restaurants?with=dishes');
    // return res.data;
}

/** Utilities */
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function cryptoRandom() { return Math.random().toString(36).slice(2) }
