// npoint.io API — dead simple JSON storage, no auth needed
import type { GameStore } from "./types";

const NPOINT_URL = "https://api.npoint.io/8ff602c321d69974b882";

export interface SharedState {
    players: GameStore["players"];
    config: GameStore["config"];
}

/** Fetch latest shared state from npoint */
export async function fetchSharedState(): Promise<SharedState | null> {
    try {
        const res = await fetch(NPOINT_URL);
        if (!res.ok) return null;
        return (await res.json()) as SharedState;
    } catch (err) {
        console.error("npoint fetch error:", err);
        return null;
    }
}

/** Push shared state to npoint (full replace) */
export async function pushSharedState(state: SharedState): Promise<boolean> {
    try {
        const res = await fetch(NPOINT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state),
        });
        return res.ok;
    } catch (err) {
        console.error("npoint push error:", err);
        return false;
    }
}

/** Extract shared portion from GameStore */
export function toSharedState(store: GameStore): SharedState {
    return { players: store.players, config: store.config };
}

// === Local Session (localStorage) ===
const SESSION_KEY = "vibeathon_session";

interface LocalSession {
    currentPlayerId: string | null;
    isAdmin: boolean;
}

export function loadLocalSession(): LocalSession {
    try {
        const s = localStorage.getItem(SESSION_KEY);
        if (s) return JSON.parse(s);
    } catch { /* */ }
    return { currentPlayerId: null, isAdmin: false };
}

export function saveLocalSession(session: LocalSession) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* */ }
}

// === Arena arrangement persistence (localStorage per player) ===
export function saveArrangement(playerId: string, fragmentIds: string[], solutionIds: string[]) {
    try {
        localStorage.setItem(`arena_${playerId}`, JSON.stringify({ fragmentIds, solutionIds }));
    } catch { /* */ }
}

export function loadArrangement(playerId: string): { fragmentIds: string[]; solutionIds: string[] } | null {
    try {
        const s = localStorage.getItem(`arena_${playerId}`);
        if (s) return JSON.parse(s);
    } catch { /* */ }
    return null;
}
