import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CRTOverlay } from "@/components/CRTOverlay";
import { useReducer, useEffect, useCallback, useRef } from "react";
import { GameContext, gameReducer, defaultStore } from "@/lib/store";
import {
  fetchSharedState,
  pushSharedState,
  toSharedState,
  loadLocalSession,
  saveLocalSession,
} from "@/lib/jsonbin";

import Login from "@/pages/Login";
import Arena from "@/pages/Arena";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/arena" component={Arena} />
      <Route path="/admin" component={Admin} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-display text-4xl">
          404 — NOT FOUND
        </div>
      </Route>
    </Switch>
  );
}

// Actions that modify shared state (players/config) and need to be pushed to JSONBin
const SHARED_ACTIONS = new Set([
  "LOGIN_PLAYER",
  "LOGOUT",
  "ADD_PLAYER",
  "SELECT_DIFFICULTY",
  "SELECT_LANGUAGE",
  "ASSIGN_PROBLEM",
  "START_PLAYING",
  "USE_DRAG",
  "START_COOLDOWN",
  "END_COOLDOWN",
  "COMMIT_SOLUTION",
  "ELIMINATE_PLAYER",
  "RESET_PLAYER",
  "RESET_ALL",
  "RESET_EVERYTHING",
  "EXTEND_TIME",
  "START_ROUND",
  "END_ROUND",
  "SET_QUALIFY_COUNT",
]);

// Actions that change local session identity
const SESSION_ACTIONS = new Set(["LOGIN_PLAYER", "LOGIN_ADMIN", "LOGOUT"]);

function App() {
  // Load local session for initial state
  const session = loadLocalSession();
  const initialState = {
    ...defaultStore,
    currentPlayerId: session.currentPlayerId,
    isAdmin: session.isAdmin,
  };

  const [state, rawDispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track if we've done an initial fetch
  const initialFetchDone = useRef(false);

  // Wrapped dispatch: after every shared-state action, push to JSONBin
  const dispatch = useCallback(
    (action: Parameters<typeof rawDispatch>[0]) => {
      rawDispatch(action);

      // We need to compute the next state to push it
      // Since rawDispatch is async in React, we compute it manually
      const nextState = gameReducer(stateRef.current, action);
      stateRef.current = nextState;

      // Save local session if it changed
      if (SESSION_ACTIONS.has(action.type)) {
        saveLocalSession({
          currentPlayerId: nextState.currentPlayerId,
          isAdmin: nextState.isAdmin,
        });
      }

      // Push shared state to JSONBin (fire-and-forget)
      if (SHARED_ACTIONS.has(action.type)) {
        pushSharedState(toSharedState(nextState));
      }
    },
    []
  );

  // Fetch shared state from JSONBin on mount
  useEffect(() => {
    async function init() {
      const shared = await fetchSharedState();
      if (shared) {
        rawDispatch({
          type: "SET_STATE",
          state: {
            players: shared.players,
            config: shared.config,
            currentPlayerId: session.currentPlayerId,
            isAdmin: session.isAdmin,
          },
        });
      }
      initialFetchDone.current = true;
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll JSONBin every 5 seconds to sync shared state
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!initialFetchDone.current) return;
      const shared = await fetchSharedState();
      if (shared) {
        const current = stateRef.current;
        rawDispatch({
          type: "SET_STATE",
          state: {
            players: shared.players,
            config: shared.config,
            // Preserve local session identity
            currentPlayerId: current.currentPlayerId,
            isAdmin: current.isAdmin,
          },
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <TooltipProvider>
        <CRTOverlay />
        <Router />
        <Toaster />
      </TooltipProvider>
    </GameContext.Provider>
  );
}

export default App;
