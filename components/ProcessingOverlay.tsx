"use client";

import React, { useState, useEffect } from "react";

interface ProcessingOverlayProps {
  onComplete: () => void;
}

export default function ProcessingOverlay({ onComplete }: ProcessingOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleVideoEnd = () => {
    // Start fade out
    setIsVisible(false);
    // Wait for transition to complete before unmounting
    setTimeout(() => {
      onComplete();
    }, 700); // Match transition duration
  };

  return (
    <div
      className={`absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-700 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center">
        <video
          src="/assets/videos/thinking.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="max-w-md rounded-lg shadow-2xl object-contain"
        />
        <p className="mt-6 text-slate-300 text-sm animate-pulse">
          Analyzing genomic profile… please wait.
        </p>
      </div>
    </div>
  );
}
