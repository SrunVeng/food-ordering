// api.js — Central API layer (mock now, easy to swap to real later)

// --- Real client (commented for now) ---
// import axios from "axios";
// export const api = axios.create({ baseURL: "http://localhost:4000" });
// api.interceptors.request.use(cfg => {
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// });

/** ---------------- AUTH ---------------- */
export async function loginApi({ username, password }) {
    // TODO (real): const { data } = await api.post('/auth/login', { username, password });
    // return data;

    await wait(400);
    if (!username || !password) throw new Error("Invalid credentials");

    // Stable id for returning users in mock mode
    const existing = findUserByName(username);
    const user = existing || { id: cryptoRandom(), username };

    upsertUser(user);

    return {
        token: "mock-token-" + Math.random().toString(36).slice(2),
        user,
    };
}

export async function registerApi({ username, password }) {
    // TODO (real): await api.post('/auth/register', { username, password });
    await wait(400);
    if (!username || !password) throw new Error("Invalid input");

    upsertUser({ id: cryptoRandom(), username });
    return { ok: true };
}

/** ---------------- GROUPS ---------------- */

/** Fetch all groups (adds memberDetails if missing for old records) */
export async function fetchGroupsApi() {
    // TODO (real): const { data } = await api.get('/groups'); return data;

    await wait(200);
    const groups = readGroups();
    const users = getUsersDict();

    const normalized = groups.map((g) => ensureMemberDetails(g, users));
    // Persist normalization so future reads are consistent
    writeGroups(normalized);
    return normalized;
}

/** Create group (expects owner info; ownerName optional) */
export async function createGroupApi(payload) {
    // payload: { name, restaurantId, ownerId, ownerName?, deadlineAt }
    // TODO (real): const { data } = await api.post('/groups', payload); return data;

    await wait(200);
    const groups = readGroups();
    const users = getUsersDict();

    const ownerName =
        payload.ownerName || users[payload.ownerId]?.username || fallbackName(payload.ownerId);

    const g = {
        id: cryptoRandom(),
        name: payload.name,
        restaurantId: payload.restaurantId,
        ownerId: payload.ownerId,
        deadlineAt: payload.deadlineAt,
        members: [payload.ownerId],
        memberDetails: [{ id: payload.ownerId, name: ownerName }],
        dishes: {}, // { [userId]: { [dishId]: qty } }
        submittedAt: null,
    };

    groups.unshift(g);
    writeGroups(groups);
    return g;
}

/** Join group (username optional; we’ll look it up) */
export async function joinGroupApi({ groupId, userId, username }) {
    // TODO (real): await api.post(`/groups/${groupId}/join`, { userId });

    await wait(150);
    const groups = readGroups();
    const users = getUsersDict();

    const idx = groups.findIndex((x) => x.id === groupId);
    if (idx === -1) throw new Error("Group not found");

    const g = groups[idx];

    g.members = g.members || [];
    g.memberDetails = g.memberDetails || [];

    if (!g.members.includes(userId)) g.members.push(userId);

    const displayName = username || users[userId]?.username || fallbackName(userId);

    const mdIdx = g.memberDetails.findIndex((m) => m.id === userId);
    if (mdIdx === -1) {
        g.memberDetails.push({ id: userId, name: displayName });
    } else if (!g.memberDetails[mdIdx].name && displayName) {
        g.memberDetails[mdIdx] = { ...g.memberDetails[mdIdx], name: displayName };
    }

    groups[idx] = g;
    writeGroups(groups);
    return g;
}

/** Add dish delta (qty can be negative/positive; 0 removes) */
export async function addDishApi({ groupId, userId, dishId, qty }) {
    // TODO (real): await api.post(`/groups/${groupId}/dishes`, { userId, dishId, qty });

    await wait(120);
    const groups = readGroups();
    const idx = groups.findIndex((x) => x.id === groupId);
    if (idx === -1) throw new Error("Group not found");

    const g = groups[idx];
    g.dishes[userId] = g.dishes[userId] || {};

    const next = (g.dishes[userId][dishId] || 0) + qty;
    if (next <= 0) delete g.dishes[userId][dishId];
    else g.dishes[userId][dishId] = next;

    groups[idx] = g;
    writeGroups(groups);
    return g;
}

/** Submit (owner only) — your backend will push Telegram later */
export async function submitGroupApi({ groupId, userId }) {
    // TODO (real): await api.post(`/groups/${groupId}/submit`);

    await wait(150);
    const groups = readGroups();
    const idx = groups.findIndex((x) => x.id === groupId);
    if (idx === -1) throw new Error("Group not found");

    const g = groups[idx];
    if (g.ownerId !== userId) throw new Error("Only owner can submit");

    g.submittedAt = Date.now();
    groups[idx] = g;
    writeGroups(groups);
    return { ok: true };
}

/** Delete group */
export async function deleteGroupApi(groupId) {
    await wait(150);
    const groups = readGroups();
    const idx = groups.findIndex((x) => x.id === groupId);
    if (idx === -1) throw new Error("Group not found");
    groups.splice(idx, 1);
    writeGroups(groups);
    return { ok: true };
}

/** ---------------- RESTAURANTS ---------------- */
export async function fetchRestaurantsApi() {
    // Front JSON for now:
    const { RESTAURANTS, DISHES_BY_RESTAURANT } = await import("../mock/data.js");
    return { restaurants: RESTAURANTS, menuMap: DISHES_BY_RESTAURANT };

    // TODO (real):
    // const { data } = await api.get('/restaurants?with=dishes');
    // return data;
}

/** ---------------- USERS (mock directory) ---------------- */
export function fetchUsersApi() {
    return Object.values(getUsersDict());
}

function getUsersDict() {
    try {
        return JSON.parse(localStorage.getItem("USERS") || "{}");
    } catch {
        return {};
    }
}
function setUsersDict(dict) {
    localStorage.setItem("USERS", JSON.stringify(dict));
}
function upsertUser(u) {
    const dict = getUsersDict();
    if (!u?.id) return;
    dict[u.id] = { ...(dict[u.id] || {}), ...u };
    setUsersDict(dict);
}
function findUserByName(username) {
    const dict = getUsersDict();
    for (const id of Object.keys(dict)) {
        if (dict[id]?.username === username) return dict[id];
    }
    return null;
}
function fallbackName(id) {
    return "User " + String(id).slice(-4);
}

/** ---------------- LOCAL STORAGE HELPERS ---------------- */
function readGroups() {
    try {
        return JSON.parse(localStorage.getItem("groups") || "[]");
    } catch {
        return [];
    }
}
function writeGroups(groups) {
    localStorage.setItem("groups", JSON.stringify(groups));
}

/** Normalize a group to always have memberDetails */
function ensureMemberDetails(g, usersDict) {
    const members = g.members || [];
    let md = g.memberDetails || [];

    const map = new Map(md.map((m) => [m.id, { ...m }]));
    for (const id of members) {
        if (!map.has(id)) {
            map.set(id, { id, name: usersDict[id]?.username || fallbackName(id) });
        } else if (!map.get(id).name) {
            map.set(id, { id, name: usersDict[id]?.username || fallbackName(id) });
        }
    }
    md = members.map((id) => map.get(id));
    return { ...g, members, memberDetails: md };
}

/** ---------------- Utilities ---------------- */
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function cryptoRandom() { return Math.random().toString(36).slice(2); }
