import { cn } from "@/lib/utils";

type Status = "playing" | "qualified" | "eliminated";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <div className={cn(
      "px-3 py-1 rounded border uppercase font-bold tracking-wider text-xs shadow-[0_0_10px_rgba(0,0,0,0.5)]",
      status === "qualified" && "bg-[hsl(var(--qualified)/0.2)] border-[hsl(var(--qualified))] text-[hsl(var(--qualified))]",
      status === "eliminated" && "bg-[hsl(var(--destructive)/0.2)] border-[hsl(var(--destructive))] text-[hsl(var(--destructive))]",
      status === "playing" && "bg-[hsl(var(--playing)/0.2)] border-[hsl(var(--playing))] text-[hsl(var(--playing))]",
      className
    )}>
      {status}
    </div>
  );
}
