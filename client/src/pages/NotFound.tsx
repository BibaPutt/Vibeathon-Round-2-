import { GlitchText } from "@/components/GlitchText";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-center p-4">
      <div className="space-y-4">
        <GlitchText text="404" className="text-9xl font-black text-primary font-display" />
        <h2 className="text-2xl font-mono text-white">SIGNAL LOST</h2>
        <div className="pt-8">
           <Link href="/" className="text-primary hover:text-white underline font-mono tracking-widest text-lg">
             RETURN TO BASE
           </Link>
        </div>
      </div>
    </div>
  );
}
