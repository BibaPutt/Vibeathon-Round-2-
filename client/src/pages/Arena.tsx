import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import type { Problem, ProblemsData, CodeChunk } from "@/lib/types";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { GlitchText } from "@/components/GlitchText";
import { cn } from "@/lib/utils";

// Shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== SUB-COMPONENTS ==========

function EliminationOverlay() {
  return (
    <div className="fixed inset-0 z-[9998] bg-black/95 flex flex-col items-center justify-center">
      <div className="text-red-600 font-black text-7xl md:text-9xl font-display border-8 border-red-600 p-8 transform -rotate-6 animate-pulse">
        ELIMINATED
      </div>
      <p className="mt-8 text-red-400 font-mono text-lg uppercase tracking-widest">
        Time has expired. You have been eliminated.
      </p>
    </div>
  );
}

function SuccessOverlay({ completionTime }: { completionTime: number }) {
  const mins = Math.floor(completionTime / 60000);
  const secs = Math.floor((completionTime % 60000) / 1000);
  return (
    <div className="fixed inset-0 z-[9998] bg-black/95 flex flex-col items-center justify-center">
      <div className="text-green-500 font-black text-6xl md:text-8xl font-display border-8 border-green-500 p-8 animate-pulse">
        QUALIFIED
      </div>
      <p className="mt-8 text-green-300 font-mono text-2xl uppercase tracking-widest">
        Completion Time: {mins}m {secs}s
      </p>
    </div>
  );
}

// ========== MODAL COMPONENTS ==========

function CooldownModal({ secondsLeft, showPrompt }: { secondsLeft: number; showPrompt: boolean }) {
  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-red-950 border-2 border-red-500 rounded-2xl p-10 text-center max-w-md animate-[scaleIn_0.3s_ease-out]">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-3xl font-display font-black text-red-400 uppercase tracking-widest mb-3">
            Moves Depleted
          </h2>
          <p className="text-red-200 font-mono text-sm">
            You've used all your moves. A 30-second cooldown is starting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9990] pointer-events-none">
      <div className="bg-red-950/90 border-2 border-red-500 rounded-xl px-8 py-4 text-center animate-[scaleIn_0.3s_ease-out] backdrop-blur-sm">
        <div className="text-xs font-mono text-red-400 uppercase tracking-widest mb-1">Cooldown</div>
        <div className="text-5xl font-display font-black text-red-500 animate-pulse">{secondsLeft}s</div>
      </div>
    </div>
  );
}

function ExecuteModal({ type, onDone }: { type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDone();
    }
  };

  if (type === "error") {
    return (
      <div
        className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center animate-[shake_0.5s_ease-in-out]"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-red-950 border-2 border-red-500 rounded-2xl p-10 text-center max-w-sm animate-[scaleIn_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-3xl font-display font-black text-red-400 uppercase tracking-widest">
            Error
          </h2>
          <p className="text-red-200 font-mono text-sm mt-2">
            Code arrangement is incorrect. Try again.
          </p>
          <button
            onClick={onDone}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-display text-sm font-bold uppercase rounded border border-red-400 shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-green-950 border-2 border-green-500 rounded-2xl p-10 text-center max-w-sm animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-display font-black text-green-400 uppercase tracking-widest">
          Success
        </h2>
        <p className="text-green-200 font-mono text-sm mt-2">
          Code is correct! Submitting your solution...
        </p>
        <button
          onClick={onDone}
          className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-display text-sm font-bold uppercase rounded border border-green-400 shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all active:scale-95"
        >
          Close
        </button>
      </div>
      <Confetti />
    </div>
  );
}

function Confetti() {
  const colors = ["#ff0050", "#00ff88", "#00aaff", "#ffcc00", "#ff44cc", "#44ffcc"];
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    duration: Math.random() * 2 + 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9991] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[confettiFall_linear_forwards]"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function DifficultySelect({ onSelect }: { onSelect: (d: "Easy" | "Medium" | "Hard") => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/90 z-0" />
      <div className="relative z-10 space-y-10 text-center max-w-xl">
        <GlitchText text="SELECT DIFFICULTY" as="h1" className="text-4xl md:text-5xl font-black text-white" />
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          Higher risk = more points. Choose wisely.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {([
            { d: "Easy" as const, pts: 1, color: "bg-green-700 hover:bg-green-600 border-green-500" },
            { d: "Medium" as const, pts: 2, color: "bg-yellow-700 hover:bg-yellow-600 border-yellow-500" },
            { d: "Hard" as const, pts: 3, color: "bg-red-700 hover:bg-red-600 border-red-500" },
          ]).map(({ d, pts, color }) => (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={cn(
                "w-full py-6 rounded border-2 font-display text-2xl font-bold text-white uppercase tracking-widest transition-all hover:scale-[1.02]",
                color
              )}
            >
              {d} <span className="text-lg opacity-80">(+{pts} point{pts > 1 ? "s" : ""})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LanguageSelect({ onSelect }: { onSelect: (lang: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/90 z-0" />
      <div className="relative z-10 space-y-10 text-center max-w-xl">
        <GlitchText text="SELECT LANGUAGE" as="h1" className="text-4xl md:text-5xl font-black text-white" />
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          Choose your weapon.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {["Python", "Java", "C++"].map((lang) => (
            <button
              key={lang}
              onClick={() => onSelect(lang)}
              className="w-full py-6 rounded border-2 border-primary/50 bg-black/50 font-display text-2xl font-bold text-primary uppercase tracking-widest transition-all hover:bg-primary hover:text-white hover:scale-[1.02]"
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN ARENA ==========

export default function Arena() {
  const { state, dispatch } = useGameStore();
  const [, setLocation] = useLocation();

  const player = state.players.find((p) => p.id === state.currentPlayerId);

  // Redirect if not logged in
  useEffect(() => {
    if (!state.currentPlayerId || !player) {
      setLocation("/");
    }
  }, [state.currentPlayerId, player, setLocation]);

  if (!player) return null;

  // Route to the right step
  if (player.status === "eliminated") return <EliminationOverlay />;
  if (player.status === "completed" && player.completionTime)
    return <SuccessOverlay completionTime={player.completionTime} />;
  if (!player.difficulty)
    return (
      <DifficultySelect
        onSelect={(d) => dispatch({ type: "SELECT_DIFFICULTY", playerId: player.id, difficulty: d })}
      />
    );
  if (!player.language)
    return (
      <LanguageSelect
        onSelect={(lang) => dispatch({ type: "SELECT_LANGUAGE", playerId: player.id, language: lang })}
      />
    );

  return <CodeArena player={player} />;
}

// ========== CODE ARENA (main game) ==========

interface ArenaChunk extends CodeChunk {
  // same as CodeChunk but we track it in drag state
}

function CodeArena({ player }: { player: ReturnType<typeof useGameStore>["state"]["players"][0] }) {
  const { state, dispatch } = useGameStore();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [fragments, setFragments] = useState<ArenaChunk[]>([]);
  const [solution, setSolution] = useState<ArenaChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [executeResult, setExecuteResult] = useState<"success" | "error" | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [canCommit, setCanCommit] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [timeLeft, setTimeLeft] = useState("10:00");
  const [isTimeCritical, setIsTimeCritical] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [showCooldownPrompt, setShowCooldownPrompt] = useState(false);
  const problemLoadedRef = useRef(false);
  const dragInProgress = useRef(false);

  // Load problem once
  useEffect(() => {
    if (problemLoadedRef.current) return;

    const loadProblems = async () => {
      try {
        const res = await fetch("/codes.json");
        if (!res.ok) {
          console.error("Failed to fetch codes.json:", res.status, res.statusText);
          setLoading(false);
          return;
        }
        const text = await res.text();
        if (!text || text.trim().length === 0) {
          console.error("codes.json is empty");
          setLoading(false);
          return;
        }
        const data = JSON.parse(text) as ProblemsData;
        if (!data.problems || !Array.isArray(data.problems)) {
          console.error("codes.json has invalid structure:", data);
          setLoading(false);
          return;
        }

        if (player.assignedProblemId && player.status === "playing") {
          // Problem already assigned (page reload)
          const p = data.problems.find((pr) => pr.id === player.assignedProblemId);
          if (p) {
            setProblem(p);
            const savedFragments = localStorage.getItem(`fragments_${player.id}`);
            const savedSolution = localStorage.getItem(`solution_${player.id}`);
            if (savedFragments && savedSolution) {
              setFragments(JSON.parse(savedFragments));
              setSolution(JSON.parse(savedSolution));
            } else {
              setFragments(shuffle(p.code_chunks));
              setSolution([]);
            }
          }
          setLoading(false);
          problemLoadedRef.current = true;
          return;
        }

        // First time — assign a random problem
        const matching = data.problems.filter(
          (p) => p.difficulty === player.difficulty && p.language === player.language
        );
        if (matching.length === 0) {
          setProblem(null);
          setLoading(false);
          return;
        }
        const chosen = matching[Math.floor(Math.random() * matching.length)];
        setProblem(chosen);
        setFragments(shuffle(chosen.code_chunks));
        setSolution([]);

        dispatch({ type: "ASSIGN_PROBLEM", playerId: player.id, problemId: chosen.id, allowedMoves: chosen.allowed_moves });
        dispatch({ type: "START_PLAYING", playerId: player.id });
        problemLoadedRef.current = true;
        setLoading(false);
      } catch (err) {
        console.error("Error loading codes.json:", err);
        setLoading(false);
      }
    };

    loadProblems();
  }, [player, dispatch]);

  // Persist drag state to sessionStorage so page refresh doesn't lose it
  useEffect(() => {
    if (fragments.length > 0 || solution.length > 0) {
      localStorage.setItem(`fragments_${player.id}`, JSON.stringify(fragments));
      localStorage.setItem(`solution_${player.id}`, JSON.stringify(solution));
    }
  }, [fragments, solution, player.id]);

  // Timer
  useEffect(() => {
    if (!player.startTime || !state.config.timerDurationSec) return;
    const endTime = player.startTime + state.config.timerDurationSec * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        dispatch({ type: "ELIMINATE_PLAYER", playerId: player.id });
        return;
      }

      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      setIsTimeCritical(diff < 60);
    }, 250);

    return () => clearInterval(interval);
  }, [player.startTime, state.config.timerDurationSec, player.id, dispatch]);

  // Cooldown timer
  useEffect(() => {
    if (!player.inCooldown || !player.cooldownEnd) {
      setCooldownTimeLeft(0);
      setShowCooldownPrompt(false);
      return;
    }

    // Show prompt for 4 seconds, then just the timer
    setShowCooldownPrompt(true);
    const promptTimer = setTimeout(() => setShowCooldownPrompt(false), 4000);

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((player.cooldownEnd! - Date.now()) / 1000));
      setCooldownTimeLeft(remaining);
      if (remaining <= 0) {
        dispatch({ type: "END_COOLDOWN", playerId: player.id });
      }
    }, 250);

    return () => {
      clearInterval(interval);
      clearTimeout(promptTimer);
    };
  }, [player.inCooldown, player.cooldownEnd, player.id, dispatch]);

  // Drag handler
  const onDragStart = useCallback(() => {
    dragInProgress.current = true;
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      dragInProgress.current = false;
      if (locked || player.inCooldown) return;
      const { source, destination } = result;
      if (!destination) return;

      const srcId = source.droppableId;
      const dstId = destination.droppableId;

      // Disallow reordering within fragments
      if (srcId === "fragments" && dstId === "fragments") return;

      // Clone arrays
      let newFragments = [...fragments];
      let newSolution = [...solution];

      // Moving from fragments to solution
      if (srcId === "fragments" && dstId === "solution") {
        if (source.index >= newFragments.length) return; // safety
        const [moved] = newFragments.splice(source.index, 1);
        if (!moved) return; // null safety
        newSolution.splice(destination.index, 0, moved);

        // Use a drag
        dispatch({ type: "USE_DRAG", playerId: player.id });

        // Check if drags are now depleted
        if (player.dragsRemaining <= 1) {
          dispatch({
            type: "START_COOLDOWN",
            playerId: player.id,
            cooldownEnd: Date.now() + 30000, // 30 second cooldown
          });
        }
      }
      // Moving from solution back to fragments
      else if (srcId === "solution" && dstId === "fragments") {
        if (source.index >= newSolution.length) return;
        const [moved] = newSolution.splice(source.index, 1);
        if (!moved) return;
        newFragments.splice(destination.index, 0, moved);
      }
      // Reordering within solution
      else if (srcId === "solution" && dstId === "solution") {
        if (source.index >= newSolution.length) return;
        const [moved] = newSolution.splice(source.index, 1);
        if (!moved) return;
        newSolution.splice(destination.index, 0, moved);

        // Reordering also uses a drag
        dispatch({ type: "USE_DRAG", playerId: player.id });
        if (player.dragsRemaining <= 1) {
          dispatch({
            type: "START_COOLDOWN",
            playerId: player.id,
            cooldownEnd: Date.now() + 30000,
          });
        }
      }

      // Filter out any null/undefined entries (safety for race conditions)
      newFragments = newFragments.filter(Boolean);
      newSolution = newSolution.filter(Boolean);

      setFragments(newFragments);
      setSolution(newSolution);
      setExecuteResult(null);
      setCanCommit(false);
    },
    [fragments, solution, locked, player, dispatch]
  );

  // Execute handler — auto-commits on success
  const handleExecute = useCallback(() => {
    if (!problem) return;
    const solutionIds = solution.map((c) => c.id);
    const isCorrect =
      solutionIds.length === problem.solution_order.length &&
      solutionIds.every((id, i) => id === problem.solution_order[i]);

    if (isCorrect) {
      setExecuteResult("success");
      setShowExecuteModal(true);

      // Auto-submit: pause timer and commit immediately
      if (player.startTime) {
        const completionTime = Date.now() - player.startTime;
        const pointsMap: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
        const points = pointsMap[player.difficulty || "Easy"];
        dispatch({ type: "COMMIT_SOLUTION", playerId: player.id, completionTime, points });
        setLocked(true);
      }
    } else {
      setExecuteResult("error");
      setShowExecuteModal(true);
    }
  }, [problem, solution, player, dispatch]);

  if (player.status === "eliminated") return <EliminationOverlay />;
  if (player.status === "completed" && player.completionTime)
    return <SuccessOverlay completionTime={player.completionTime} />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-primary font-mono text-xl animate-pulse">LOADING FRAGMENTS...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-red-500 font-mono text-xl">
          No problems available for {player.difficulty} / {player.language}. Contact admin.
        </div>
      </div>
    );
  }

  // Warning screen before game starts
  if (showWarning) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/90 z-0" />
        <div className="relative z-10 space-y-8 text-center max-w-lg">
          <GlitchText text="⚠ READ CAREFULLY" as="h1" className="text-3xl md:text-4xl font-black text-yellow-400" />
          <div className="space-y-4 text-left bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-6 font-mono text-sm text-yellow-200">
            <p>• You have <span className="text-white font-bold">{player.totalDrags} moves</span> to arrange the code blocks.</p>
            <p>• When your moves run out, there is a <span className="text-white font-bold">30-second cooldown</span> before you can move again.</p>
            <p>• Press <span className="text-white font-bold">EXECUTE</span> to test your arrangement.</p>
            <p>• If your code is correct, it will be <span className="text-white font-bold">auto-submitted</span> and your time will be recorded.</p>
            <p className="text-red-400 font-bold">• Don't rush. Use your moves carefully.</p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="w-full py-4 rounded bg-primary font-display text-xl font-bold text-white uppercase tracking-widest hover:bg-red-600 transition-all"
          >
            I UNDERSTAND — BEGIN
          </button>
        </div>
      </div>
    );
  }

  const isDragDisabled = locked || player.inCooldown;

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", showExecuteModal && executeResult === "error" && "animate-[shake_0.5s_ease-in-out]")}>
      {/* Cooldown Modal */}
      {player.inCooldown && (
        <CooldownModal secondsLeft={cooldownTimeLeft} showPrompt={showCooldownPrompt} />
      )}

      {/* Execute Result Modal */}
      {showExecuteModal && executeResult && (
        <ExecuteModal type={executeResult} onDone={() => setShowExecuteModal(false)} />
      )}

      {/* Header */}
      <header className="h-16 border-b border-border bg-black/60 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="text-lg font-display font-bold text-primary">{player.username}</div>
          <div className="text-xs font-mono text-muted-foreground uppercase">
            {player.difficulty} / {player.language}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Drag Counter */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Moves</span>
            <span className={cn(
              "text-lg font-mono font-bold",
              player.dragsRemaining <= 2 ? "text-red-500 animate-pulse" : "text-white"
            )}>
              {player.dragsRemaining}
            </span>
          </div>

          {/* Timer */}
          <div className={cn(
            "font-display text-3xl tracking-widest",
            isTimeCritical ? "text-primary animate-pulse" : "text-white"
          )}>
            {timeLeft}
          </div>
        </div>
      </header>

      {/* Task Description */}
      <div className="px-6 py-6 bg-primary/5 border-b-2 border-primary/20 flex flex-col items-center justify-center text-center space-y-2">
        <h2 className="text-primary font-display text-xs font-black tracking-[0.3em] uppercase opacity-70">
          — CORE MISSION OBJECTIVE —
        </h2>
        <p className="text-xl md:text-2xl font-mono text-white font-bold max-w-4xl leading-tight">
          {problem.task}
        </p>
      </div>

      {/* Main Content */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Fragment Section */}
          <div className="border-r border-border flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-between">
              <h2 className="font-display text-sm font-bold tracking-widest text-muted-foreground uppercase">
                Code Fragments
              </h2>
              <span className="text-xs font-mono text-muted-foreground">{fragments.length} blocks</span>
            </div>
            <Droppable droppableId="fragments">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]",
                    snapshot.isDraggingOver && "bg-primary/5"
                  )}
                >
                  {fragments.filter(Boolean).map((chunk, index) => (
                    <Draggable
                      key={chunk.id}
                      draggableId={`frag-${chunk.id}`}
                      index={index}
                      isDragDisabled={isDragDisabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-card border border-border rounded p-3 font-mono text-xs whitespace-pre-wrap transition-all",
                            snapshot.isDragging && "shadow-[0_0_20px_rgba(255,0,80,0.3)] border-primary/50 scale-105",
                            isDragDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {chunk.content}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {fragments.length === 0 && (
                    <div className="text-center text-muted-foreground font-mono text-xs py-8 opacity-50">
                      All fragments moved to solution
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* Solution Buffer */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-between">
              <h2 className="font-display text-sm font-bold tracking-widest text-primary uppercase">
                Solution
              </h2>
              <span className="text-xs font-mono text-muted-foreground">{solution.length} blocks</span>
            </div>
            <Droppable droppableId="solution">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]",
                    snapshot.isDraggingOver && "bg-green-950/10 border-green-500/20"
                  )}
                >
                  {solution.filter(Boolean).map((chunk, index) => (
                    <Draggable
                      key={chunk.id}
                      draggableId={`sol-${chunk.id}`}
                      index={index}
                      isDragDisabled={isDragDisabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-card border rounded p-3 font-mono text-xs whitespace-pre-wrap transition-all",
                            "border-primary/30",
                            snapshot.isDragging && "shadow-[0_0_20px_rgba(0,255,100,0.3)] border-green-500/50 scale-105",
                            isDragDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-primary/40 mr-2 select-none">{index + 1}.</span>
                          {chunk.content}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {solution.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-muted-foreground font-mono text-xs text-center opacity-50">
                        Drag code fragments here<br />to build your solution
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Bottom Actions */}
      <div className="border-t border-border bg-black/60 backdrop-blur px-4 py-3 flex items-center justify-between gap-4">
        {/* Execute Result */}
        <div className="flex-1 text-center">
          {executeResult === "success" && (
            <span className="text-green-500 font-display text-lg font-bold uppercase animate-pulse">
              ✓ Success — Press Submit for final time
            </span>
          )}
          {executeResult === "error" && (
            <span className="text-red-500 font-display text-lg font-bold uppercase">
              ✗ Error — Rearrange and try again
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExecute}
            disabled={locked || solution.length === 0}
            className="px-6 py-3 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed font-display text-sm font-bold text-white uppercase tracking-widest transition-all"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
