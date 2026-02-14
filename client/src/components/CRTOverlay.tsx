export function CRTOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
      <div className="absolute inset-0 animate-[flicker_0.15s_infinite] bg-white/5 opacity-[0.02] pointer-events-none mix-blend-overlay" />
    </div>
  );
}
