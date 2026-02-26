"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Database, Rocket, Play } from "lucide-react";
import { ParsedVCF } from "@/lib/vcf-parser";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFileLoaded: (content: string, fileName: string, parsedVCF: ParsedVCF) => void;
  parseVCF: (content: string) => ParsedVCF;
}

export default function Dropzone({ onFileLoaded, parseVCF }: DropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedVCF | null>(null);
  const [parsingProgress, setParsingProgress] = useState(0);

  // Simulated progress during parsing
  useEffect(() => {
    if (isParsing) {
      setParsingProgress(0);
      const interval = setInterval(() => {
        setParsingProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isParsing]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { message: string }[] }[]) => {
      setError(null);
      setParseResult(null);

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        setError(err.message || "Invalid file type. Only .vcf files are accepted.");
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (!file.name.toLowerCase().endsWith(".vcf")) {
        setError("Invalid file type. Only .vcf files are accepted.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File exceeds 5MB limit. Please use a smaller VCF file.");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setIsParsing(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Small delay to show the awesome parsing animation
        setTimeout(() => {
          try {
            const parsed = parseVCF(content);
            setParseResult(parsed);
            setIsParsing(false);
            setParsingProgress(100);
            onFileLoaded(content, file.name, parsed);
          } catch {
            setError("Failed to parse VCF file. Please check the file format.");
            setIsParsing(false);
          }
        }, 2000);
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setIsParsing(false);
      };
      reader.readAsText(file);
    },
    [onFileLoaded, parseVCF]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/plain": [".vcf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    noClick: true, // We have a custom button, but the whole area can still be active
  });

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const primaryColor = "#13b6ec";

  return (
    <div className="w-full flex-1 flex flex-col min-h-[400px]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        @keyframes shimmer_effect {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .anim-scanline {
          animation: scanline 3s ease-in-out infinite;
        }
        .anim-shimmer {
          animation: shimmer_effect 2s linear infinite;
        }
      `}} />

      <div 
        {...getRootProps()} 
        className={`relative flex flex-col items-center justify-center flex-1 w-full rounded-2xl transition-all duration-300 overflow-hidden ${
          isParsing ? "bg-[#0d161a] border border-[#23363d]" : 
          parseResult ? "bg-[#18282e]/30 border-2 border-dashed border-[#203239] group" : 
          isDragActive ? "bg-[#11181c] border-2 border-dashed border-[#13b6ec] shadow-[0_0_30px_rgba(19,182,236,0.3)]" : 
          "bg-[#11181c] border-2 border-dashed border-[#283539] hover:border-[#13b6ec]/50 group cursor-pointer shadow-[0_0_20px_rgba(19,182,236,0.15)]"
        }`}
        onClick={(!isParsing && !parseResult) ? open : undefined}
      >
        <input {...getInputProps()} />

        {isParsing ? (
          // --- PARSING STATE ---
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 p-8">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#13b6ec 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             
             {/* Central Icon Pulse */}
             <div className="relative">
               <div className="absolute inset-0 bg-[#13b6ec]/20 blur-xl rounded-full animate-pulse"></div>
               <div className="relative bg-[#18282e] border border-[#13b6ec]/30 rounded-full p-6 text-[#13b6ec] shadow-[0_0_30px_rgba(19,182,236,0.15)]">
                 <Loader2 className="w-12 h-12 animate-spin" />
               </div>
             </div>

             {/* Status Text & Progress */}
             <div className="w-full flex flex-col gap-4">
               <div className="flex justify-between items-end font-mono text-[#13b6ec] text-sm tracking-widest uppercase">
                 <span className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-[#13b6ec] animate-pulse"></span>
                   Extracting Phenotype Hash...
                 </span>
                 <span className="text-white font-bold">[{parsingProgress}%]</span>
               </div>
               
               <div className="h-12 w-full bg-[#161e23] rounded border border-[#23363d] relative overflow-hidden flex items-center px-4">
                 {/* Shimmer Effect */}
                 <div className="absolute inset-0 w-full h-full anim-shimmer z-0" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(19, 182, 236, 0.1) 50%, transparent 100%)' }}></div>
                 {/* Fill */}
                 <div className="absolute left-0 top-0 bottom-0 bg-[#13b6ec]/10 border-r border-[#13b6ec]/50 transition-all duration-300" style={{ width: `${parsingProgress}%` }}></div>
                 {/* Text Overlay */}
                 <div className="relative z-10 flex justify-between w-full text-xs font-mono text-slate-400">
                   <span>FILE: {fileName}</span>
                   <span>{formatSize(fileSize)}</span>
                 </div>
               </div>
               <div className="flex justify-between text-xs text-slate-500 font-mono">
                 <span>PHARMAGUARD ENGINE</span>
                 <span className="animate-pulse">PROCESSING</span>
               </div>
             </div>
             
             {/* Scanner Brackets */}
             <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#13b6ec]/40 rounded-tl-xl m-4 animate-pulse"></div>
             <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#13b6ec]/40 rounded-tr-xl m-4 animate-pulse opacity-75"></div>
             <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#13b6ec]/40 rounded-bl-xl m-4 animate-pulse opacity-50"></div>
             <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#13b6ec]/40 rounded-br-xl m-4 animate-pulse opacity-90"></div>
             {/* Scanline */}
             <div className="absolute top-0 left-0 w-full h-1 anim-scanline shadow-[0_0_15px_#13b6ec]" style={{ background: 'linear-gradient(to right, transparent, rgba(19, 182, 236, 0.5), transparent)' }}></div>
          </div>
        ) : parseResult ? (
          // --- COMPLETE STATE ---
          <div className="relative z-10 text-center max-w-md p-6 flex flex-col items-center">
            <div className="absolute inset-0 opacity-[0.3] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #203239 1px, transparent 1px), linear-gradient(to bottom, #203239 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="w-16 h-16 bg-[#203239] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#203239] group-hover:border-[#13b6ec]/50 group-hover:scale-110 transition-all duration-300 relative z-10">
              <CheckCircle2 className="w-8 h-8 text-slate-400 group-hover:text-[#13b6ec] transition-colors" />
            </div>
            
            <h4 className="text-xl font-bold text-white mb-2 relative z-10">Workspace Ready</h4>
            <p className="text-slate-400 text-sm mb-4 relative z-10">
              Data ingestion complete. {parseResult.variants.length} mapped variants detected.
            </p>

            {/* Dynamically render detected genes from payload */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 relative z-10">
              {Array.from(new Set(parseResult.variants.map((v) => v.gene)))
                .filter(Boolean)
                .map((gene, idx) => (
                  <span key={idx} className="bg-[#13b6ec]/10 border border-[#13b6ec]/30 text-[#13b6ec] text-xs font-mono px-2 py-1 rounded">
                    {gene}
                  </span>
                ))}
            </div>

            {/* Handle missing genes dynamically via genes_missing array state */}
            {parseResult.genes_missing && parseResult.genes_missing.length > 0 && (
              <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-6 relative z-10">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Missing Genes
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {parseResult.genes_missing.map((gene, idx) => (
                    <span key={`missing-${idx}`} className="text-rose-300/80 text-xs font-mono bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                      {gene}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); open(); }}
                className="px-5 py-2.5 bg-[#203239] hover:bg-[#203239]/80 text-white rounded-lg font-medium text-sm transition-colors border border-[#203239] hover:border-[#13b6ec]/50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select New File
              </button>
            </div>
          </div>
        ) : (
          // --- EMPTY STATE ---
          <>
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#13b6ec] rounded-tl-lg m-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#13b6ec] rounded-tr-lg m-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#13b6ec] rounded-bl-lg m-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#13b6ec] rounded-br-lg m-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex flex-col items-center gap-8 px-6 py-12 z-10 pointer-events-none">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#1c262b] border border-[#283539] group-hover:border-[#13b6ec] group-hover:bg-[#1c262b]/80 transition-all duration-500 shadow-xl">
                <div className="absolute inset-2 rounded-full border border-dashed border-slate-600 group-hover:border-[#13b6ec]/50 group-hover:rotate-45 transition-all duration-700"></div>
                {isDragActive ? <Database className="w-10 h-10 text-[#13b6ec]" /> : <Upload className="w-10 h-10 text-[#13b6ec]" />}
              </div>
              
              <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-slate-100 text-3xl md:text-4xl font-bold tracking-tight">{isDragActive ? "Drop to Ingest Data" : "Upload Genomic Data"}</h1>
                <p className="text-slate-400 text-base max-w-[480px] font-light">
                  Drag & drop <span className="text-[#13b6ec] font-mono text-sm bg-[#13b6ec]/10 px-1 py-0.5 rounded">.vcf</span> files to initialize sequence analysis.
                </p>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); open(); }}
                className="mt-4 pointer-events-auto flex items-center justify-center rounded-lg h-12 px-8 bg-[#13b6ec] hover:bg-[#2bf0dc] text-[#0d161a] text-sm font-bold uppercase tracking-widest font-mono transition-colors shadow-[0_0_15px_rgba(19,182,236,0.4)] hover:shadow-[0_0_25px_rgba(19,182,236,0.6)]"
              >
                Select Local Files
              </button>
            </div>
            
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#13b6ec 1px, transparent 1px), linear-gradient(90deg, #13b6ec 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          </>
        )}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 font-mono shadow-[0_0_15px_rgba(244,63,94,0.1)]"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}
    </div>
  );
}
