import { createContext, useContext } from "react";
import type { GameStore, GameAction, Player, GameConfig } from "./types";

// === Default State ===
function createDefaultPlayer(id: string): Player {
    return {
        id,
        username: `VB-${id}`,
        status: "idle",
        difficulty: null,
        language: null,
        points: 0,
        assignedProblemId: null,
        completionTime: null,
        startTime: null,
        dragsRemaining: 0,
        totalDrags: 0,
        inCooldown: false,
        cooldownEnd: null,
        loggedIn: false,
    };
}

function createDefaultPlayers(): Player[] {
    const players: Player[] = [];
    for (let i = 1; i <= 20; i++) {
        players.push(createDefaultPlayer(String(i).padStart(3, "0")));
    }
    return players;
}

const defaultConfig: GameConfig = {
    timerDurationSec: 600, // 10 minutes
    roundActive: false,
    roundStartTime: null,
    qualifyCount: 10,
};

export const defaultStore: GameStore = {
    players: createDefaultPlayers(),
    config: defaultConfig,
    currentPlayerId: null,
    isAdmin: false,
};

// === Reducer ===
export function gameReducer(state: GameStore, action: GameAction): GameStore {
    switch (action.type) {
        case "LOGIN_PLAYER": {
            // Mark player as logged in on the shared state + set local session
            return {
                ...state,
                currentPlayerId: action.playerId,
                isAdmin: false,
                players: state.players.map((p) =>
                    p.id === action.playerId ? { ...p, loggedIn: true } : p
                ),
            };
        }
        case "LOGIN_ADMIN": {
            return { ...state, currentPlayerId: null, isAdmin: true };
        }
        case "LOGOUT": {
            // Mark player as logged out in shared state
            const logoutPlayerId = state.currentPlayerId;
            return {
                ...state,
                currentPlayerId: null,
                isAdmin: false,
                players: logoutPlayerId
                    ? state.players.map((p) =>
                        p.id === logoutPlayerId ? { ...p, loggedIn: false } : p
                    )
                    : state.players,
            };
        }
        case "ADD_PLAYER": {
            const exists = state.players.find((p) => p.id === action.id);
            if (exists) return state;
            return {
                ...state,
                players: [...state.players, createDefaultPlayer(action.id)],
            };
        }
        case "SELECT_DIFFICULTY": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, difficulty: action.difficulty, status: "selecting" as const }
                        : p
                ),
            };
        }
        case "SELECT_LANGUAGE": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, language: action.language }
                        : p
                ),
            };
        }
        case "ASSIGN_PROBLEM": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? {
                            ...p,
                            assignedProblemId: action.problemId,
                            dragsRemaining: action.allowedMoves,
                            totalDrags: action.allowedMoves,
                        }
                        : p
                ),
            };
        }
        case "START_PLAYING": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, status: "playing" as const, startTime: Date.now() }
                        : p
                ),
            };
        }
        case "USE_DRAG": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, dragsRemaining: Math.max(0, p.dragsRemaining - 1) }
                        : p
                ),
            };
        }
        case "START_COOLDOWN": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, inCooldown: true, cooldownEnd: action.cooldownEnd }
                        : p
                ),
            };
        }
        case "END_COOLDOWN": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? {
                            ...p,
                            inCooldown: false,
                            cooldownEnd: null,
                            dragsRemaining: p.totalDrags,
                        }
                        : p
                ),
            };
        }
        case "COMMIT_SOLUTION": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? {
                            ...p,
                            status: "completed" as const,
                            completionTime: action.completionTime,
                            points: action.points,
                        }
                        : p
                ),
            };
        }
        case "ELIMINATE_PLAYER": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId
                        ? { ...p, status: "eliminated" as const }
                        : p
                ),
            };
        }
        case "RESET_PLAYER": {
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.playerId ? createDefaultPlayer(p.id) : p
                ),
            };
        }
        case "RESET_ALL": {
            return {
                ...state,
                players: state.players.map((p) => createDefaultPlayer(p.id)),
            };
        }
        case "RESET_EVERYTHING": {
            return {
                ...defaultStore,
                players: createDefaultPlayers(),
            };
        }
        case "EXTEND_TIME": {
            return {
                ...state,
                config: {
                    ...state.config,
                    timerDurationSec: state.config.timerDurationSec + action.extraSeconds,
                },
            };
        }
        case "START_ROUND": {
            return {
                ...state,
                config: {
                    ...state.config,
                    roundActive: true,
                    roundStartTime: Date.now(),
                },
            };
        }
        case "END_ROUND": {
            return {
                ...state,
                config: {
                    ...state.config,
                    roundActive: false,
                },
            };
        }
        case "SET_QUALIFY_COUNT": {
            return {
                ...state,
                config: { ...state.config, qualifyCount: action.count },
            };
        }
        case "SET_STATE": {
            return action.state;
        }
        default:
            return state;
    }
}

// === Context ===
export interface GameContextType {
    state: GameStore;
    dispatch: React.Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextType | null>(null);

export function useGameStore(): GameContextType {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGameStore must be used within GameStoreProvider");
    return ctx;
}
