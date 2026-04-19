"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error natively
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0a1f] to-[#1a0a2e] flex flex-col items-center justify-center relative p-4">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="z-10 flex flex-col items-center text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <AlertTriangle className="w-10 h-10 text-red-400 relative z-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">Something went wrong!</h1>
        <p className="text-red-200/60 text-sm mb-3 font-mono break-all line-clamp-2 px-4 py-2 bg-black/40 rounded border border-white/5">
          {error.message || "An unexpected Javascript error disrupted the application"}
        </p>
        <p className="text-white/40 text-sm mb-8">
          The Talk to Data dashboard encountered a fatal exception. Please reset the instance thread.
        </p>

        <button 
          onClick={() => reset()}
          className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
