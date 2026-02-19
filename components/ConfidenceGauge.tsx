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
    if (s >= 0.85) return { stroke: "#00C896", text: "text-jade-500" };
    if (s >= 0.7) return { stroke: "#FFB800", text: "text-amber-500" };
    return { stroke: "#FF2D55", text: "text-crimson-500" };
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
            stroke="rgba(139, 149, 168, 0.1)"
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
            style={{
              filter: `drop-shadow(0 0 6px ${colors.stroke}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold font-mono ${colors.text}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-wider">Confidence</p>
        <p className={`text-sm font-semibold ${colors.text}`}>
          {score >= 0.85 ? "High" : score >= 0.7 ? "Moderate" : "Low"}
        </p>
      </div>
    </div>
  );
}
