"use client";

import React from "react";
import VoiceAgent from "@/components/VoiceAgent";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ImmersiveVoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-display">
      {/* Minimal Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-md rounded-full border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Report
        </button>
        
        <div className="flex items-center gap-3 bg-slate-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800/50">
           <Image
              src="/assets/image/logo.png"
              alt="GenomaVeda Logo"
              width={24}
              height={24}
              className="object-contain opacity-80"
           />
           <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">GenomIX AI</span>
        </div>
      </header>

      {/* Main Immersive Area */}
      <main className="flex-1 flex flex-col pt-24 px-4 pb-4 md:p-8 max-w-6xl w-full mx-auto justify-center h-full">
         <VoiceAgent />
      </main>
    </div>
  );
}
