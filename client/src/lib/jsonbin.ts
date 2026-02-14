// JSONBin.io API wrapper
// Shared state (players + config) lives on JSONBin; local session lives in localStorage

import type { GameStore } from "./types";

const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const API_BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export interface SharedState {
    players: GameStore["players"];
    config: GameStore["config"];
}

/** Fetch latest shared state from JSONBin */
export async function fetchSharedState(): Promise<SharedState | null> {
    try {
        const res = await fetch(`${API_BASE}/latest`, {
            headers: {
                "X-Master-Key": MASTER_KEY,
                "X-Bin-Meta": "false",
            },
        });
        if (!res.ok) {
            console.error("JSONBin fetch failed:", res.status, res.statusText);
            return null;
        }
        const data = await res.json();
        return data as SharedState;
    } catch (err) {
        console.error("JSONBin fetch error:", err);
        return null;
    }
}

/** Push shared state to JSONBin (full replace) */
export async function pushSharedState(state: SharedState): Promise<boolean> {
    try {
        const res = await fetch(API_BASE, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": MASTER_KEY,
            },
            body: JSON.stringify(state),
        });
        if (!res.ok) {
            console.error("JSONBin push failed:", res.status, res.statusText);
            return false;
        }
        return true;
    } catch (err) {
        console.error("JSONBin push error:", err);
        return false;
    }
}

/** Extract the shared portion of a GameStore */
export function toSharedState(store: GameStore): SharedState {
    return {
        players: store.players,
        config: store.config,
    };
}

// === Local Session (localStorage) ===
const SESSION_KEY = "vibeathon_session";

interface LocalSession {
    currentPlayerId: string | null;
    isAdmin: boolean;
}

export function loadLocalSession(): LocalSession {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) return JSON.parse(saved);
    } catch { /* */ }
    return { currentPlayerId: null, isAdmin: false };
}

export function saveLocalSession(session: LocalSession) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* */ }
}

export function clearLocalSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch { /* */ }
}
