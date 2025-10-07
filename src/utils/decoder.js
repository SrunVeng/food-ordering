export function decodeJwt(token) {
    try {
        if (!token || typeof token !== "string") return null;

        const payload = token.split(".")[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "===".slice((base64.length + 3) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
        const json = new TextDecoder().decode(bytes);

        return JSON.parse(json);
    } catch {
        return null;
    }
}


export function claimsToUser(claims) {
    return {username: claims.sub};
}
