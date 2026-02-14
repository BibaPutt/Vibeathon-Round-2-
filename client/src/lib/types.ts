// === Problem Data (from codes.json) ===
export interface CodeChunk {
    id: string;
    content: string;
    is_distractor: boolean;
}

export interface Problem {
    id: string;
    language: string;
    difficulty: "Easy" | "Medium" | "Hard";
    task: string;
    allowed_moves: number;
    code_chunks: CodeChunk[];
    solution_order: string[];
}

export interface ProblemsData {
    problems: Problem[];
}

// === Player State ===
export interface Player {
    id: string; // "001" - "020" etc.
    username: string; // display name like "VB-001"
    status: "idle" | "selecting" | "playing" | "completed" | "eliminated";
    difficulty: "Easy" | "Medium" | "Hard" | null;
    language: string | null;
    points: number;
    assignedProblemId: string | null;
    completionTime: number | null; // milliseconds taken
    startTime: number | null; // timestamp when arena started
    dragsRemaining: number;
    totalDrags: number;
    inCooldown: boolean;
    cooldownEnd: number | null; // timestamp
    loggedIn: boolean; // true if a player is actively logged in on some device
}

// === Game Config ===
export interface GameConfig {
    timerDurationSec: number; // default 600 (10 min)
    roundActive: boolean;
    roundStartTime: number | null; // timestamp
    qualifyCount: number; // how many top players qualify (by fastest time)
}

// === Full Store State ===
export interface GameStore {
    players: Player[];
    config: GameConfig;
    currentPlayerId: string | null; // logged-in player
    isAdmin: boolean;
}

// === Action Types ===
export type GameAction =
    | { type: "LOGIN_PLAYER"; playerId: string }
    | { type: "LOGIN_ADMIN" }
    | { type: "LOGOUT" }
    | { type: "ADD_PLAYER"; id: string }
    | { type: "SELECT_DIFFICULTY"; playerId: string; difficulty: "Easy" | "Medium" | "Hard" }
    | { type: "SELECT_LANGUAGE"; playerId: string; language: string }
    | { type: "ASSIGN_PROBLEM"; playerId: string; problemId: string; allowedMoves: number }
    | { type: "USE_DRAG"; playerId: string }
    | { type: "START_COOLDOWN"; playerId: string; cooldownEnd: number }
    | { type: "END_COOLDOWN"; playerId: string }
    | { type: "START_PLAYING"; playerId: string }
    | { type: "COMMIT_SOLUTION"; playerId: string; completionTime: number; points: number }
    | { type: "ELIMINATE_PLAYER"; playerId: string }
    | { type: "RESET_PLAYER"; playerId: string }
    | { type: "RESET_ALL" }
    | { type: "RESET_EVERYTHING" }
    | { type: "EXTEND_TIME"; extraSeconds: number }
    | { type: "START_ROUND" }
    | { type: "END_ROUND" }
    | { type: "SET_QUALIFY_COUNT"; count: number }
    | { type: "SET_STATE"; state: GameStore };
