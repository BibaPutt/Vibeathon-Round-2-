import { useState } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { GlitchText } from "@/components/GlitchText";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { RotateCcw, Trash2, Clock, ArrowLeft, Trophy, Target } from "lucide-react";

export default function Admin() {
  const { state, dispatch } = useGameStore();
  const [, setLocation] = useLocation();

  const [qualifyInput, setQualifyInput] = useState(String(state.config.qualifyCount));

  // Auth check
  if (!state.isAdmin) {
    setLocation("/");
    return null;
  }

  const players = state.players;
  const completed = players.filter((p) => p.status === "completed");
  const eliminated = players.filter((p) => p.status === "eliminated");
  const playing = players.filter((p) => p.status === "playing");
  const idle = players.filter((p) => p.status === "idle" || p.status === "selecting");

  // Sort completed players by completion time (quickest first)
  const leaderboard = [...completed]
    .filter((p) => p.completionTime !== null)
    .sort((a, b) => (a.completionTime || Infinity) - (b.completionTime || Infinity));

  const qualifyCount = state.config.qualifyCount;
  const qualifiedPlayers = leaderboard.slice(0, qualifyCount);
  const notQualifiedPlayers = leaderboard.slice(qualifyCount);



  const handleResetPlayer = (id: string) => {
    dispatch({ type: "RESET_PLAYER", playerId: id });
  };

  const handleResetAll = () => {
    if (confirm("Reset ALL players' progress? This cannot be undone.")) {
      dispatch({ type: "RESET_ALL" });
    }
  };

  const handleResetEverything = () => {
    if (confirm("Reset EVERYTHING including game state? This cannot be undone.")) {
      dispatch({ type: "RESET_EVERYTHING" });
    }
  };

  const handleExtendTime = () => {
    dispatch({ type: "EXTEND_TIME", extraSeconds: 300 }); // +5 minutes
  };

  const handleSetQualifyCount = () => {
    const num = parseInt(qualifyInput, 10);
    if (!isNaN(num) && num > 0) {
      dispatch({ type: "SET_QUALIFY_COUNT", count: num });
    }
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "—";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "qualified";
      case "eliminated": return "eliminated";
      case "playing": return "playing";
      default: return "playing";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-black/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display font-bold text-primary">GAME MASTER CONTROL</h1>
        </div>
        <button
          onClick={() => {
            dispatch({ type: "LOGOUT" });
            setLocation("/");
          }}
          className="text-sm font-mono text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Exit
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: players.length, color: "text-white" },
            { label: "Playing", value: playing.length + idle.length, color: "text-yellow-400" },
            { label: "Completed", value: completed.length, color: "text-green-500" },
            { label: "Eliminated", value: eliminated.length, color: "text-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-1">{label}</div>
              <div className={cn("text-3xl font-display font-bold", color)}>{value}</div>
            </div>
          ))}
        </div>

        {/* Qualification Count */}
        <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Qualify Top:</span>
          </div>
          <input
            type="number"
            min="1"
            value={qualifyInput}
            onChange={(e) => setQualifyInput(e.target.value)}
            className="w-24 bg-black/50 border border-border rounded px-3 py-2 font-mono text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-center"
          />
          <button
            onClick={handleSetQualifyCount}
            className="px-4 py-2 rounded bg-yellow-700 hover:bg-yellow-600 font-display text-sm font-bold text-white uppercase tracking-wider transition-all"
          >
            Set
          </button>
          <span className="text-xs font-mono text-muted-foreground">
            Top {qualifyCount} players by fastest time will qualify
          </span>
        </div>

        {/* Timer Control */}
        <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
            <Clock className="w-4 h-4" />
            Timer: {Math.floor(state.config.timerDurationSec / 60)}m (default 10m)
          </div>
          <button
            onClick={handleExtendTime}
            className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 font-display text-sm font-bold text-white uppercase tracking-wider transition-all"
          >
            + 5 Minutes
          </button>
        </div>



        {/* Reset Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetAll}
            className="px-4 py-2 rounded bg-yellow-700 hover:bg-yellow-600 font-display text-sm font-bold text-white uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset All Players
          </button>
          <button
            onClick={handleResetEverything}
            className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 font-display text-sm font-bold text-white uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Reset Everything
          </button>
        </div>

        {/* Leaderboard / Qualified Players */}
        {leaderboard.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold tracking-widest text-yellow-400 uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Leaderboard — Top {qualifyCount} Qualify
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => {
                    const isQualified = i < qualifyCount;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b border-border/50 transition-colors",
                          isQualified ? "bg-green-950/20" : "bg-red-950/10 opacity-70"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-lg font-display font-bold",
                            i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"
                          )}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-display font-bold text-white">{p.username}</td>
                        <td className="px-4 py-3 font-mono text-sm text-white">{formatTime(p.completionTime)}</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{p.difficulty || "—"}</td>
                        <td className="px-4 py-3 font-mono text-sm text-primary font-bold">{p.points}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-mono font-bold uppercase px-2 py-1 rounded",
                            isQualified
                              ? "bg-green-900/50 text-green-400 border border-green-500/30"
                              : "bg-red-900/50 text-red-400 border border-red-500/30"
                          )}>
                            {isQualified ? "QUALIFIED" : "NOT QUALIFIED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Player List */}
        <div className="space-y-2">
          <h2 className="font-display text-lg font-bold tracking-widest text-muted-foreground uppercase">
            Players ({players.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-4 transition-all",
                  player.status === "completed"
                    ? "bg-green-950/10 border-green-900/50"
                    : player.status === "eliminated"
                      ? "bg-red-950/10 border-red-900/50 opacity-60"
                      : "bg-card border-border"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xl font-display font-bold tracking-tighter">{player.username}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {player.difficulty || "—"} / {player.language || "—"}
                    </div>
                  </div>
                  <StatusBadge status={getStatusLabel(player.status) as any} />
                </div>

                <div className="grid grid-cols-2 gap-y-1 text-xs font-mono text-muted-foreground mb-3">
                  <div>
                    Points: <span className="text-primary font-bold">{player.points}</span>
                  </div>
                  <div>
                    Time: <span className="text-foreground">{formatTime(player.completionTime)}</span>
                  </div>
                  <div>
                    Drags: <span className="text-foreground">{player.dragsRemaining}/{player.totalDrags}</span>
                  </div>
                  <div>
                    Problem: <span className="text-foreground">{player.assignedProblemId || "—"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleResetPlayer(player.id)}
                  className="w-full py-1.5 rounded border border-border text-xs font-mono text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" /> Reset Player
                </button>

                {/* Eliminated overlay */}
                {player.status === "eliminated" && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <div className="text-red-600 font-black text-2xl font-display border-2 border-red-600 px-3 py-1 transform -rotate-12 opacity-80">
                      ELIMINATED
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
