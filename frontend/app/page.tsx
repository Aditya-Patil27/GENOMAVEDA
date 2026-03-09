"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FeatureCardsFan from "@/components/FeatureCardsFan";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 3.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Hide splash screen after fade completes (4 seconds total)
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen font-['Syne',sans-serif] overflow-x-hidden pt-12 md:pt-20 bg-[#040810]/40">

      {/* Splash Screen Overlay */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#040810] transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"
            }`}
        >
          <div className="relative z-10 text-center animate-fade-in-scale">
            <div className="flex items-center justify-center mb-8">
              <Image
                src="/assets/image/logo.png"
                alt="GenomaVeda Logo"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#F0F6FF] tracking-tight">
              GenomaVeda
            </h1>
          </div>
          <style jsx>{`
            @keyframes fadeInScale {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in-scale {
              animation: fadeInScale 1.2s ease-out forwards;
            }
          `}</style>
        </div>
      )}


      {/* Animated Background - The Genome Visualiser */}
      <GenomeBackground />

      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 px-6">



        {/* Centered Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 mb-20"
        >
          <Image
            src="/assets/image/logo.png"
            alt="GenomaVeda Logo"
            width={100}
            height={100}
            className="object-contain drop-shadow-[0_0_24px_rgba(0,212,255,0.4)]"
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F0F6FF] tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
            GenomaVeda
          </h1>
        </motion.div>

        {/* H1 */}

        <div className="text-center max-w-4xl tracking-[-0.02em] font-bold text-4xl sm:text-5xl md:text-[56px] leading-[1.1] mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="text-[#F0F6FF]"
          >
            100,000 preventable deaths.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            className="text-[#00D4FF]"
          >
            Your genome knows the reason.
          </motion.div>
        </div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[#94A3B8] text-sm sm:text-base md:text-lg max-w-xl text-center leading-[1.7] mb-12 font-['Syne',sans-serif]"
        >
          PharmaGuard analyzes your VCF file against 6 genes and CPIC guidelines — entirely inside your browser. Your DNA never leaves this tab.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center w-full gap-4"
        >
          <button
            onClick={() => router.push("/upload")}
            className="group relative flex items-center justify-center gap-2 bg-[#00D4FF] hover:bg-[#00e5ff] text-[#040810] rounded-xl h-14 px-10 font-bold text-[15px] transition-all duration-300"
            style={{ boxShadow: "0 0 30px rgba(0,212,255,0.25), 0 4px 16px rgba(0,0,0,0.4)" }}
          >
            Analyze Your Genome
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>



        {/* Feature Fan of Cards */}
        <div className="w-full max-w-6xl mt-32 md:mt-48 mb-20 md:mb-32">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight text-[#F0F6FF]"
          >
            Platform Intelligence
          </motion.h2>
          <FeatureCardsFan />
        </div>

        {/* Bottom: Gene x Drug Matrix */}
        <div className="w-full max-w-5xl mt-20 mb-32">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight text-[#F0F6FF]">Clinical Deterministic Matrix</h2>
          <GeneDrugMatrix />
        </div>

      </main>
    </div>
  );
}

// ----------------------------------------------------
// Sub-components
// ----------------------------------------------------

function GenomeBackground() {
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    // Generate random columns only on CSR to avoid hydration mismatch
    const cols = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i / 24) * 100}%`,
      animationDuration: `${Math.random() * 40 + 40}s`, // 40-80s
      opacity: Math.random() * 0.05 + 0.03, // 0.03 to 0.08
      delay: `-${Math.random() * 40}s`,
      sequence: Array.from({ length: 50 }).map(() => ["A", "T", "C", "G"][Math.floor(Math.random() * 4)]).join(" ")
    }));
    setColumns(cols);
  }, []);

  return (
    <div
      className="absolute inset-x-0 top-0 h-[800px] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      {columns.map(col => (
        <div
          key={col.id}
          className="absolute font-mono text-[11px] font-bold tracking-[0.3em] flex flex-col whitespace-pre text-[#00D4FF]"
          style={{
            left: col.left,
            opacity: col.opacity,
            animation: `scrollUp ${col.animationDuration} linear infinite`,
            animationDelay: col.delay,
          }}
        >
          {col.sequence}{"\n"}{col.sequence}
        </div>
      ))}
      <style jsx>{`
        @keyframes scrollUp {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}



function GeneDrugMatrix() {
  const rows = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];
  const cols = ["Codeine", "Clopidogrel", "Warfarin", "Simvastatin", "Azathioprine", "Capecitabine"];

  const getRiskCol = (r: number, c: number) => {
    if (r === 0 && c === 0) return "#FF2D55"; // toxic
    if (r === 1 && c === 1) return "#FFB800"; // adjust
    if (r === 3 && c === 3) return "#FF2D55"; // toxic
    if (r === 2 && c === 2) return "#FFB800"; // adjust
    if (r === 4 && c === 4) return "#FF2D55"; // toxic
    if (r === 5 && c === 5) return "#FF2D55"; // toxic
    if (c === 2 && r === 1) return "#FFB800";
    if (c === 0 && r === 2) return "#FF2D55";
    return "#00FF88"; // safe
  };

  const getRiskName = (color: string) => {
    if (color === "#FF2D55") return "Critical interaction detected";
    if (color === "#FFB800") return "Dosage adjustment required";
    return "Standard dosing safe";
  }

  const [matrixData] = useState(() =>
    rows.map((_, r) => cols.map((_, c) => getRiskCol(r, c)))
  );

  return (
    <div className="overflow-x-auto w-full flex justify-center pb-4 px-4 scrollbar-hide">
      <div className="bg-[#080E1C] border border-[#1A2744] rounded-2xl p-6 shadow-xl max-w-full">
        <div className="grid grid-cols-7 gap-1 min-w-[700px]">
          {/* Header Row */}
          <div className="h-10 flex items-center px-2 text-[10px] font-bold text-[#334155] uppercase tracking-wider">Gene / Drug</div>
          {cols.map((col, c) => (
            <div key={c} className="h-10 flex items-center justify-center p-2 text-xs font-bold text-[#94A3B8]">
              {col}
            </div>
          ))}

          {/* Data Rows */}
          {rows.map((row, r) => (
            <React.Fragment key={r}>
              {/* Row Header */}
              <div className="h-12 flex items-center px-2 font-mono text-[13px] font-bold text-[#A5B4FC]">
                {row}
              </div>

              {/* Cells */}
              {cols.map((col, c) => {
                const riskColor = matrixData[r][c];
                return (
                  <div key={c} className="h-12 flex items-center justify-center p-1.5 group relative">
                    <div
                      className="w-full h-full rounded transition-all duration-300 hover:scale-[1.15] cursor-crosshair border border-[#1A2744] flex items-center justify-center"
                      style={{
                        backgroundColor: `${riskColor}15`,
                        borderColor: `${riskColor}30`,
                        boxShadow: `inset 0 0 10px ${riskColor}15`
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskColor, boxShadow: `0 0 8px ${riskColor}` }} />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#0C1528] border border-[#1A2744] text-[#F0F6FF] p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform scale-95 group-hover:scale-100 w-52 z-50">
                      <div className="font-bold mb-1.5 font-mono text-[11px] text-[#A5B4FC] tracking-wider uppercase border-b border-[#1A2744] pb-1.5">{row} + {col}</div>
                      <div className="text-[13px] leading-tight font-medium" style={{ color: riskColor }}>
                        {getRiskName(riskColor)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
