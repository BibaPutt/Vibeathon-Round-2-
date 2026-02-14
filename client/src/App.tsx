import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CRTOverlay } from "@/components/CRTOverlay";
import { useReducer, useEffect } from "react";
import { GameContext, gameReducer, loadStore, saveStore } from "@/lib/store";

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

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadStore);

  // Persist state to localStorage on every change
  useEffect(() => {
    saveStore(state);
  }, [state]);

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
