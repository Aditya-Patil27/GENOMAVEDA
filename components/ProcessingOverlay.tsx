"use client";

import React, { useState, useEffect, useRef } from "react";

interface ProcessingOverlayProps {
  onComplete: () => void;
}

export default function ProcessingOverlay({ onComplete }: ProcessingOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fallback: If video doesn't load or play within 3 seconds, skip overlay
    timeoutRef.current = setTimeout(() => {
      handleVideoEnd();
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleVideoEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Start fade out
    setIsVisible(false);
    // Wait for transition to complete before unmounting
    setTimeout(() => {
      onComplete();
    }, 700); // Match transition duration
  };

  const handleVideoError = () => {
    console.warn("Video failed to load, skipping overlay");
    handleVideoEnd();
  };

  const handleVideoCanPlay = () => {
    // Video loaded successfully, clear the fallback timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div
      className={`absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-700 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center">
        <video
          ref={videoRef}
          src="/assets/videos/thinking.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
          className="max-w-md rounded-lg shadow-2xl object-contain"
        />
        <p className="mt-6 text-slate-300 text-sm animate-pulse">
          Analyzing genomic profile… please wait.
        </p>
      </div>
    </div>
  );
}
