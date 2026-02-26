"use client";

import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { X, RefreshCw, CheckCircle2 } from "lucide-react";

interface MedicineScannerProps {
  onIngredientFound: (ingredient: string) => void;
  onClose: () => void;
}

export default function MedicineScanner({ onIngredientFound, onClose }: MedicineScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
  };

  const processImage = async (src: string | null) => {
    if (!src) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/scan-pill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: src }),
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      if (data.ingredient) {
        // Immediately trigger state transition strictly based on dynamic string returned
        onIngredientFound(data.ingredient);
      } else {
        setError("Could not confidently identify the active ingredient.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#101d22] text-slate-100 font-display animate-fade-in overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
            0% { top: 10%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 90%; opacity: 0; }
        }
        @keyframes slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .anim-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-[#18262b]/50 bg-[#101d22]/90 backdrop-blur-md px-6 py-4 absolute w-full z-50">
        <div className="flex items-center gap-3 text-white">
          <div className="w-6 h-6 text-[#13b6ec]">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight font-display tracking-tight">Edge-Vision</h2>
        </div>
        <div className="flex flex-1 justify-end gap-4">
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18262b] text-white hover:bg-[#18262b]/80 transition-colors border border-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="relative flex-1 w-full bg-black overflow-hidden flex flex-col items-center justify-center">
        {/* Camera Feed Background */}
        <div className="absolute inset-0 z-0">
          {!imgSrc ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover opacity-60 mix-blend-overlay filter blur-[2px]" />
          )}
          
          {/* Dark overlay & grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0"></div>
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(19, 182, 236, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 182, 236, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* HUD Elements */}
        {(!error) && (
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-12 pointer-events-none">
            {/* Top HUD */}
            <div className="flex justify-between items-start pt-[60px]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#13b6ec]/70 mb-1">
                  <span className="text-xs font-mono tracking-wider uppercase">Patient ID: 894-XJ</span>
                </div>
                <div className="h-px w-32 bg-[#13b6ec]/30"></div>
                <div className="text-white/80 font-mono text-xs mt-1">
                  SYS ACTIVE <span className="text-white/40">|</span> O2: 98%
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[#13b6ec]/70 mb-1">
                  <span className="text-xs font-mono tracking-wider uppercase">Mode: Diagnostic</span>
                </div>
                <div className="h-px w-32 bg-[#13b6ec]/30"></div>
                <div className="text-white/80 font-mono text-xs mt-1">
                  ZOOM: 1.5x <span className="text-white/40">|</span> ISO: AUTO
                </div>
              </div>
            </div>

            {/* Center HUD: Reticle / Active Scan Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!isProcessing ? (
                // Idle Scanning Box
                <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#13b6ec]"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#13b6ec]"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#13b6ec]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#13b6ec]"></div>
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#13b6ec] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(19,182,236,0.8)]"></div>
                  {/* Moving line */}
                  <div className="absolute left-[-10%] right-[-10%] h-[2px] bg-[#13b6ec]/60 top-1/2 animate-[scan_3s_ease-in-out_infinite]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(19, 182, 236, 0), rgba(19, 182, 236, 0.5) 50%, rgba(19, 182, 236, 0))', boxShadow: '0 0 15px rgba(19, 182, 236, 0.4)' }}></div>
                </div>
              ) : (
                // Active Processing Flash
                <div className="absolute inset-4 md:inset-12 border-2 border-[#13b6ec] shadow-[0_0_30px_rgba(19,182,236,0.3)] rounded-2xl flex flex-col justify-between p-6 animate-pulse">
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 border-l-4 border-t-4 border-[#13b6ec] rounded-tl-lg"></div>
                    <div className="w-8 h-8 border-r-4 border-t-4 border-[#13b6ec] rounded-tr-lg"></div>
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 border-l-4 border-b-4 border-[#13b6ec] rounded-bl-lg"></div>
                    <div className="w-8 h-8 border-r-4 border-b-4 border-[#13b6ec] rounded-br-lg"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom HUD */}
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto pb-[100px]">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-[#101d22]/80 backdrop-blur rounded-full border border-[#13b6ec]/20">
                  <div className={`w-2 h-2 rounded-full bg-[#13b6ec] ${isProcessing ? 'animate-ping' : 'animate-pulse'}`}></div>
                  <span className="text-[#13b6ec] font-mono text-sm tracking-widest uppercase">{isProcessing ? 'Analyzing...' : 'Scanning...'}</span>
                </div>
                <p className="text-white/50 text-xs font-mono">{isProcessing ? 'Extracting API from image' : 'Keep subject in frame'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Capture */}
        {(!imgSrc && !isProcessing) && (
          <div className="absolute bottom-8 right-8 z-20">
            <button onClick={capture} className="flex items-center justify-center w-16 h-16 rounded-full bg-[#13b6ec] text-[#101d22] shadow-lg shadow-[#13b6ec]/20 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl">camera</span>
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute bottom-8 w-full px-6 flex justify-center z-30">
            <div className="bg-rose-950/80 backdrop-blur-md border border-rose-500/50 p-4 rounded-xl flex items-center justify-between w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 text-rose-200">
                <span className="material-symbols-outlined text-rose-500">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={retake} className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 rounded border border-rose-500/30 text-xs font-mono transition-colors">
                RETRY
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
