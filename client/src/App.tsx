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

// Actions that modify shared state and need to be pushed to npoint
const SHARED_ACTIONS = new Set([
  "LOGIN_PLAYER", "LOGOUT", "ADD_PLAYER",
  "SELECT_DIFFICULTY", "SELECT_LANGUAGE", "ASSIGN_PROBLEM",
  "START_PLAYING", "USE_DRAG", "START_COOLDOWN", "END_COOLDOWN",
  "COMMIT_SOLUTION", "ELIMINATE_PLAYER",
  "RESET_PLAYER", "RESET_ALL", "RESET_EVERYTHING",
  "EXTEND_TIME", "START_ROUND", "END_ROUND", "SET_QUALIFY_COUNT",
]);

// Actions that change local session
const SESSION_ACTIONS = new Set(["LOGIN_PLAYER", "LOGIN_ADMIN", "LOGOUT"]);

function App() {
  const session = loadLocalSession();
  const initialState = {
    ...defaultStore,
    currentPlayerId: session.currentPlayerId,
    isAdmin: session.isAdmin,
  };

  const [state, rawDispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Wrapped dispatch: pushes shared state to npoint after mutations
  const dispatch = useCallback(
    (action: Parameters<typeof rawDispatch>[0]) => {
      rawDispatch(action);

      const nextState = gameReducer(stateRef.current, action);
      stateRef.current = nextState;

      if (SESSION_ACTIONS.has(action.type)) {
        saveLocalSession({
          currentPlayerId: nextState.currentPlayerId,
          isAdmin: nextState.isAdmin,
        });
      }

      // Push to npoint (fire-and-forget)
      if (SHARED_ACTIONS.has(action.type)) {
        pushSharedState(toSharedState(nextState));
      }
    },
    []
  );

  // Fetch shared state from npoint on mount
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
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll npoint every 1 second for live updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const shared = await fetchSharedState();
      if (shared) {
        const current = stateRef.current;
        rawDispatch({
          type: "SET_STATE",
          state: {
            players: shared.players,
            config: shared.config,
            currentPlayerId: current.currentPlayerId,
            isAdmin: current.isAdmin,
          },
        });
      }
    }, 1000);
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
