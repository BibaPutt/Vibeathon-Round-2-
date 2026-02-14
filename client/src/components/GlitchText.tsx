import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
}

export function GlitchText({ text, className, as: Component = "span" }: GlitchTextProps) {
  return (
    <div className="relative inline-block group">
      <Component className={cn("relative z-10", className)}>
        {text}
      </Component>
      <Component 
        aria-hidden="true" 
        className={cn("absolute top-0 left-0 -z-10 opacity-0 group-hover:opacity-70 text-primary animate-pulse translate-x-[2px]", className)}
      >
        {text}
      </Component>
      <Component 
        aria-hidden="true" 
        className={cn("absolute top-0 left-0 -z-10 opacity-0 group-hover:opacity-70 text-blue-500 animate-pulse translate-x-[-2px]", className)}
      >
        {text}
      </Component>
    </div>
  );
}
