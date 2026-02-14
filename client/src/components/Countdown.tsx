import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";

interface CountdownProps {
  targetDate: Date | string | null;
  className?: string;
}

export function Countdown({ targetDate, className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft("00:00");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(targetDate);
      const diff = differenceInSeconds(end, now);

      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsCritical(true);
        clearInterval(interval);
        return;
      }

      const m = Math.floor(diff / 60);
      const s = diff % 60;
      
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      setIsCritical(diff < 60); // Critical if less than 1 minute
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={cn(
      "font-display text-4xl tracking-widest",
      isCritical ? "text-primary animate-pulse" : "text-white",
      className
    )}>
      {timeLeft}
    </div>
  );
}
