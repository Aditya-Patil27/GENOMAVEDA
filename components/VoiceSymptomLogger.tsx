"use client";

import React, { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, TrendingUp, RotateCcw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SymptomEntry {
  timestamp: string;
  time: string;
  transcript: string;
  symptom: string;
  severity: number;
  category: string;
  drug: string;
}

interface VoiceSymptomLoggerProps {
  drug: string;
}

// Check browser support (will be false on SSR)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR || null;
}

export default function VoiceSymptomLogger({ drug }: VoiceSymptomLoggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const SR = getSpeechRecognition();

  const startListening = useCallback(() => {
    if (!SR) {
      setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }

    setError(null);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const current = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(current);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error !== "no-speech") {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, [SR]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const processTranscript = useCallback(async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/parse-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, drug }),
      });

      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        setEntries((prev) => [
          ...prev,
          {
            timestamp: now.toISOString(),
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            transcript,
            symptom: data.symptom,
            severity: data.severity,
            category: data.category,
            drug,
          },
        ]);
        setTranscript("");
      } else {
        // Fallback: keyword-based extraction
        const severity = extractSeverityFromKeywords(transcript);
        const now = new Date();
        setEntries((prev) => [
          ...prev,
          {
            timestamp: now.toISOString(),
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            transcript,
            symptom: "Reported symptom",
            severity,
            category: "general",
            drug,
          },
        ]);
        setTranscript("");
      }
    } catch {
      // Fallback if API completely fails
      const severity = extractSeverityFromKeywords(transcript);
      const now = new Date();
      setEntries((prev) => [
        ...prev,
        {
          timestamp: now.toISOString(),
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          transcript,
          symptom: "Reported symptom",
          severity,
          category: "general",
          drug,
        },
      ]);
      setTranscript("");
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, drug]);

  return (
    <div className="glass rounded p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? "bg-crimson-500/20 border border-crimson-500/40 animate-pulse"
              : "bg-teal-400/10 border border-teal-400/30"
          }`}>
            {isListening ? (
              <Mic className="w-4 h-4 text-crimson-500" />
            ) : (
              <Mic className="w-4 h-4 text-teal-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-offwhite">
              Voice Symptom Logger
            </h3>
            <p className="text-xs text-muted">
              Speak your symptoms • AI extracts severity • Track over time
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => setEntries([])}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-offwhite transition-colors"
            title="Clear log"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Mic Controls */}
      <div className="flex items-center gap-3 mb-4">
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-400/10 hover:bg-teal-400/20 text-teal-400 border border-teal-400/25 rounded transition-all text-sm font-medium"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="flex items-center gap-2 px-4 py-2.5 bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-500 border border-crimson-500/25 rounded transition-all text-sm font-medium animate-pulse"
          >
            <MicOff className="w-4 h-4" />
            Stop
          </button>
        )}

        {transcript && !isListening && (
          <button
            onClick={processTranscript}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 rounded transition-all text-sm font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Log Symptom
              </>
            )}
          </button>
        )}
      </div>

      {/* Live transcript */}
      {(transcript || isListening) && (
        <div className="bg-base-800/80 rounded p-3 mb-4 border border-offwhite/5">
          <p className="text-[10px] font-mono text-muted uppercase mb-1">
            {isListening ? "🔴 Listening..." : "Transcript"}
          </p>
          <p className="text-sm text-offwhite/90 font-mono">
            {transcript || (
              <span className="text-muted italic">Speak now...</span>
            )}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-crimson-500 mb-3">⚠ {error}</p>
      )}

      {/* Symptom severity chart */}
      {entries.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
              Symptom Severity Timeline
            </h4>
          </div>
          <div className="bg-base-800/60 rounded p-3 border border-offwhite/5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={entries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,149,168,0.1)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#8B95A8", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "rgba(139,149,168,0.2)" }}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "#8B95A8", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "rgba(139,149,168,0.2)" }}
                  label={{ value: "Severity", angle: -90, position: "insideLeft", fill: "#8B95A8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0E1429",
                    border: "1px solid rgba(0,229,204,0.2)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono",
                  }}
                  labelStyle={{ color: "#8B95A8" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${value}/10`, "Severity"]}
                />
                <ReferenceLine y={7} stroke="rgba(255,45,85,0.3)" strokeDasharray="3 3" label={{ value: "⚠ High", fill: "#FF2D55", fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="severity"
                  stroke="#00E5CC"
                  strokeWidth={2}
                  dot={{ fill: "#00E5CC", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#00E5CC", r: 6, stroke: "#0A0F1E", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Entry log */}
          <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
            {[...entries].reverse().map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono py-1 px-2 bg-base-800/40 rounded">
                <span className="text-muted flex-shrink-0">{e.time}</span>
                <span className={`font-bold flex-shrink-0 ${
                  e.severity >= 7 ? "text-crimson-500" : e.severity >= 4 ? "text-amber-500" : "text-jade-500"
                }`}>
                  {e.severity}/10
                </span>
                <span className="text-offwhite/70 truncate">{e.transcript}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No SR support message */}
      {!SR && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3 text-xs text-amber-400 font-mono">
          ⚠ SpeechRecognition API not available. Use Chrome, Edge, or Safari for voice features.
        </div>
      )}
    </div>
  );
}

/** Keyword-based fallback severity extraction */
function extractSeverityFromKeywords(text: string): number {
  const lower = text.toLowerCase();
  const severeWords = ["terrible", "unbearable", "worst", "excruciating", "agonizing", "can't move", "emergency"];
  const highWords = ["really bad", "very painful", "intense", "severe", "strong", "awful"];
  const moderateWords = ["aching", "uncomfortable", "noticeable", "moderate", "sore", "hurts"];
  const lowWords = ["mild", "slight", "little", "minor", "barely", "tiny"];

  if (severeWords.some((w) => lower.includes(w))) return 9;
  if (highWords.some((w) => lower.includes(w))) return 7;
  if (moderateWords.some((w) => lower.includes(w))) return 5;
  if (lowWords.some((w) => lower.includes(w))) return 3;
  return 5; // default moderate
}
