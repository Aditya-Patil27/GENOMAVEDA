"use client";

import React from "react";

interface ConfidenceGaugeProps {
  score: number;
}

export default function ConfidenceGauge({ score }: ConfidenceGaugeProps) {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score * circumference);

  const getColor = (s: number) => {
    if (s >= 0.85) return { stroke: "#10b981", text: "text-emerald-400" };
    if (s >= 0.7) return { stroke: "#fbbf24", text: "text-amber-400" };
    return { stroke: "#ef4444", text: "text-red-400" };
  };

  const colors = getColor(score);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
          {/* Background arc */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(71, 85, 105, 0.3)"
            strokeWidth="4"
          />
          {/* Progress arc */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold font-mono ${colors.text}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider">Confidence</p>
        <p className={`text-sm font-semibold ${colors.text}`}>
          {score >= 0.85 ? "High" : score >= 0.7 ? "Moderate" : "Low"}
        </p>
      </div>
    </div>
  );
}
