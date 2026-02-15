import { useState } from "react";
import { useLocation } from "wouter";
import { GlitchText } from "@/components/GlitchText";
import { useGameStore } from "@/lib/store";
import { fetchSharedState } from "@/lib/jsonbin";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const { dispatch } = useGameStore();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    // Admin login
    if (trimmed === "tumhari_maut") {
      dispatch({ type: "LOGIN_ADMIN" });
      setLocation("/admin");
      return;
    }

    // Player login
    const numericId = trimmed.replace(/\D/g, "");
    if (!numericId) {
      setError("Invalid code. Enter your player number.");
      return;
    }

    const paddedId = numericId.padStart(3, "0");

    // Fetch latest state from npoint to check if player is already active
    setChecking(true);
    setError("");
    const shared = await fetchSharedState();
    setChecking(false);

    if (!shared) {
      setError("Could not connect to server. Try again.");
      return;
    }

    const player = shared.players.find((p) => p.id === paddedId);

    if (!player) {
      setError(`Player ${paddedId} not found. Contact admin.`);
      return;
    }

    // Block if player is already playing or selecting on another device
    if (player.status === "playing" || player.status === "selecting") {
      setError(`Player ${paddedId} is already in a session.`);
      return;
    }

    if (player.status === "eliminated") {
      setError("You have been ELIMINATED.");
      return;
    }

    if (player.status === "completed") {
      setError("You have already completed the challenge.");
      return;
    }

    dispatch({ type: "LOGIN_PLAYER", playerId: paddedId });
    setLocation("/arena");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/90 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-10 left-10 text-primary/20 text-9xl font-display select-none">○</div>
      <div className="absolute bottom-10 right-10 text-primary/20 text-9xl font-display select-none">△</div>
      <div className="absolute top-1/2 right-20 text-primary/20 text-9xl font-display select-none">□</div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <GlitchText
            text="SYSTEM ACCESS"
            as="h1"
            className="text-5xl md:text-6xl font-black text-white tracking-tighter"
          />
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">
            Enter your identification code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="ID-###"
              className="w-full bg-black/50 border-2 border-primary/30 rounded px-6 py-4 text-center text-3xl font-mono text-primary placeholder:text-primary/20 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(255,0,80,0.4)] transition-all uppercase tracking-widest"
              autoFocus
              disabled={checking}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-200 text-sm font-mono text-center animate-pulse">
              ACCESS DENIED: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full group relative overflow-hidden bg-primary px-8 py-4 rounded transition-all hover:bg-red-600 disabled:opacity-50"
          >
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]" />
            <span className="relative font-display text-xl font-bold tracking-widest text-white uppercase">
              {checking ? "Verifying..." : "Enter Arena"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
