import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";

export default function NotFound() {
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
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-purple-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3">404 - Page Not Found</h1>
        <p className="text-white/60 text-lg mb-8 leading-relaxed">
          The dataset view or conversational thread you're looking for doesn't exist or has been flushed from memory.
        </p>

        <Link 
          href="/" 
          className="px-8 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
