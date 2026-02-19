"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Dropzone from "@/components/Dropzone";
import { parseVCF, ParsedVCF } from "@/lib/vcf-parser";
import { usePharmaGuard } from "@/context/PharmaGuardContext";

export default function UploadPage() {
  const router = useRouter();
  const { setParsedVCFData, setDetectedGenes } = usePharmaGuard();

  const handleFileLoaded = useCallback(
    (_content: string, _fileName: string, parsed: ParsedVCF) => {
      const genes = Array.from(new Set(parsed.variants.map((v) => v.gene)));

      // Store in context
      setParsedVCFData(parsed);
      setDetectedGenes(genes);

      // Navigate to drug selection
      router.push("/select-drug");
    },
    [router, setParsedVCFData, setDetectedGenes]
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-6">
      {/* Logo and Title - Exact same style as splash page */}
      <div className="relative z-10 text-center mb-16 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/assets/image/logo.png"
            alt="GenomaVeda Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-3">
          GenomaVeda
        </h1>
        <p className="text-slate-400 text-base">
          Precision medicine, decoded
        </p>
      </div>

      {/* Dropzone */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in-delay">
        <Dropzone onFileLoaded={handleFileLoaded} parseVCF={parseVCF} />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDelay {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-fade-in-delay {
          animation: fadeInDelay 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
