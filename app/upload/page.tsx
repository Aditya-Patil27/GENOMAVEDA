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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Logo and Title */}
      <div className="relative z-10 text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Image
            src="/assets/image/logo.png"
            alt="GenomaVeda Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-2">
          GenomaVeda
        </h1>
        <p className="text-slate-400 text-sm">
          Precision medicine, decoded
        </p>
      </div>

      {/* Dropzone */}
      <div className="relative z-10 w-full max-w-2xl px-6">
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

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
