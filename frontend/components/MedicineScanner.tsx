"use client";

import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, CheckCircle2, Loader2, X } from "lucide-react";

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
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
  };

  const processImage = async () => {
    if (!imgSrc) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/scan-pill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imgSrc }),
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      if (data.ingredient) {
        onIngredientFound(data.ingredient);
      } else {
        setError("Could not confidently identify the active ingredient. Please try again or type it manually.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-400" />
            Scan Medicine Packaging
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
          {!imgSrc ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full h-full object-cover"
              />
              {/* Overlay guides */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-white/30 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="w-16 h-[2px] bg-teal-400/80 absolute top-0 -mt-[1px] shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"></div>
                <div className="w-16 h-[2px] bg-teal-400/80 absolute bottom-0 -mb-[1px] shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"></div>
                <div className="h-16 w-[2px] bg-teal-400/80 absolute left-0 -ml-[1px] shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"></div>
                <div className="h-16 w-[2px] bg-teal-400/80 absolute right-0 -mr-[1px] shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"></div>
              </div>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-3" />
              <p className="font-medium animate-pulse">Analyzing blister pack...</p>
              <p className="text-xs text-slate-300 mt-1">Extracting active pharmaceutical ingredient</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-800/50">
          {error && (
            <div className="mb-4 text-xs text-crimson-400 bg-crimson-500/10 p-3 rounded-md border border-crimson-500/20">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            {!imgSrc ? (
              <button
                onClick={capture}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20"
              >
                <Camera className="w-5 h-5" />
                Capture Image
              </button>
            ) : (
              <>
                <button
                  onClick={retake}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-[2] bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    "Analyzing..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Use This Image
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
