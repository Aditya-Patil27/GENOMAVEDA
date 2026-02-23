"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  History,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { AnalysisResult } from "@/lib/types";

/* ─── Types ──────────────────────────────────────────────────── */
interface HistoryEntry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  drug: string;
  gene: string;
  diplotype: string;
  phenotype: string;
  riskLabel: string;
  severity: string;
  confidence: number;
}

interface DrugHistoryTrackerProps {
  results: AnalysisResult[];
}

const STORAGE_KEY = "pharmaguard_drug_history";

/* ─── Persistence helpers ────────────────────────────────────── */
function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — silently fail
  }
}

function resultToEntry(r: AnalysisResult): HistoryEntry {
  const now = new Date();
  return {
    id: `${r.drug}-${now.getTime()}`,
    timestamp: now.toISOString(),
    date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    drug: r.drug,
    gene: r.pharmacogenomic_profile.primary_gene,
    diplotype: r.pharmacogenomic_profile.diplotype,
    phenotype: r.pharmacogenomic_profile.phenotype,
    riskLabel: r.risk_assessment.risk_label,
    severity: r.risk_assessment.severity,
    confidence: r.risk_assessment.confidence_score,
  };
}

/* ─── Risk colors ────────────────────────────────────────────── */
const riskDot: Record<string, string> = {
  Toxic: "bg-crimson-500",
  "Adjust Dosage": "bg-amber-500",
  Safe: "bg-jade-500",
  Unknown: "bg-muted",
};

const riskText: Record<string, string> = {
  Toxic: "text-crimson-500",
  "Adjust Dosage": "text-amber-500",
  Safe: "text-jade-500",
  Unknown: "text-muted",
};

const severityToNumber: Record<string, number> = {
  critical: 10,
  high: 8,
  moderate: 5,
  low: 2,
  minimal: 1,
};

/* ─── Component ──────────────────────────────────────────────── */
export default function DrugHistoryTracker({ results }: DrugHistoryTrackerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [lastSavedIds, setLastSavedIds] = useState<Set<string>>(new Set());

  // Load on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Auto-save new results
  const saveResults = useCallback(() => {
    if (results.length === 0) return;

    const currentIds = results.map((r) => `${r.drug}-${r.timestamp}`);
    const alreadySaved = currentIds.every((id) => lastSavedIds.has(id));
    if (alreadySaved) return;

    const newEntries = results.map(resultToEntry);
    const updated = [...newEntries, ...loadHistory()].slice(0, 100); // cap at 100
    saveHistory(updated);
    setHistory(updated);

    const newIdSet = new Set(lastSavedIds);
    currentIds.forEach((id) => newIdSet.add(id));
    setLastSavedIds(newIdSet);
  }, [results, lastSavedIds]);

  useEffect(() => {
    saveResults();
  }, [saveResults]);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setLastSavedIds(new Set());
  };

  // Build chart data from history (newest first → reverse for chart)
  const chartData = [...history]
    .reverse()
    .slice(-20) // last 20 entries
    .map((e) => ({
      label: `${e.drug.slice(0, 4)} ${e.date.split(" ").slice(0, 2).join(" ")}`,
      risk: severityToNumber[e.severity] || 5,
      confidence: Math.round(e.confidence * 100),
      drug: e.drug,
      riskLabel: e.riskLabel,
    }));

  // Group by drug for summary stats
  const drugStats: Record<string, { count: number; lastRisk: string; lastDate: string }> = {};
  for (const e of history) {
    if (!drugStats[e.drug]) {
      drugStats[e.drug] = { count: 0, lastRisk: e.riskLabel, lastDate: e.date };
    }
    drugStats[e.drug].count++;
  }

  if (history.length === 0 && results.length === 0) return null;

  return (
    <div className="glass rounded p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-400/10 border border-teal-400/30">
            <History className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-heading font-bold text-offwhite flex items-center gap-2">
              Drug Analysis History
              <span className="text-xs font-mono font-normal text-muted bg-base-700/80 px-2 py-0.5 rounded">
                {history.length} records
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </h3>
            <p className="text-xs text-muted">
              Encrypted local storage • Track longitudinal risk over time
            </p>
          </div>
        </button>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 px-2 py-1 text-xs text-crimson-400 hover:text-crimson-300 hover:bg-crimson-500/10 rounded transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-5">
          {/* Drug Summary Cards */}
          {Object.keys(drugStats).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(drugStats).map(([drug, stat]) => (
                <div
                  key={drug}
                  className="bg-base-800/60 rounded px-3 py-2 border border-offwhite/5 flex items-center gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${riskDot[stat.lastRisk] || "bg-muted"}`} />
                  <span className="text-xs font-mono text-offwhite/90 font-semibold">{drug}</span>
                  <span className="text-[10px] text-muted">×{stat.count}</span>
                  <span className={`text-[10px] font-mono ${riskText[stat.lastRisk] || "text-muted"}`}>
                    {stat.lastRisk}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Risk Trajectory Chart */}
          {chartData.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
                  Risk Trajectory
                </h4>
              </div>
              <div className="bg-base-800/60 rounded p-3 border border-offwhite/5">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,149,168,0.1)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#8B95A8", fontSize: 9, fontFamily: "JetBrains Mono" }}
                      axisLine={{ stroke: "rgba(139,149,168,0.2)" }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: "#8B95A8", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={{ stroke: "rgba(139,149,168,0.2)" }}
                      label={{ value: "Risk Level", angle: -90, position: "insideLeft", fill: "#8B95A8", fontSize: 10 }}
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
                      formatter={(value: any, name: any) => {
                        if (name === "risk") return [`${value}/10`, "Risk"];
                        return [`${value}%`, "Confidence"];
                      }}
                    />
                    <ReferenceLine
                      y={8}
                      stroke="rgba(255,45,85,0.3)"
                      strokeDasharray="3 3"
                      label={{ value: "⚠ High Risk", fill: "#FF2D55", fontSize: 9 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke="#FF2D55"
                      strokeWidth={2}
                      dot={{ fill: "#FF2D55", r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: "#FF2D55", r: 5, stroke: "#0A0F1E", strokeWidth: 2 }}
                      name="risk"
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#00E5CC"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={{ fill: "#00E5CC", r: 2, strokeWidth: 0 }}
                      name="confidence"
                      yAxisId={0}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History Table */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <h4 className="text-xs font-mono font-bold text-offwhite uppercase tracking-wider">
                  Analysis Log
                </h4>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {history.slice(0, 30).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 text-xs font-mono py-2 px-3 bg-base-800/40 rounded border border-offwhite/3 hover:bg-base-800/60 transition-colors"
                  >
                    {/* Date */}
                    <span className="text-muted flex-shrink-0 w-20">{entry.date}</span>
                    <span className="text-muted/60 flex-shrink-0 w-12">{entry.time}</span>

                    {/* Drug + Gene */}
                    <span className="text-offwhite/90 font-semibold flex-shrink-0 w-24 truncate">
                      {entry.drug}
                    </span>
                    <span className="text-teal-400/70 flex-shrink-0 w-16">{entry.gene}</span>

                    {/* Diplotype */}
                    <span className="text-muted flex-shrink-0 w-16 truncate">{entry.diplotype}</span>

                    {/* Risk badge */}
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${riskDot[entry.riskLabel] || "bg-muted"}`} />
                      <span className={`font-semibold ${riskText[entry.riskLabel] || "text-muted"}`}>
                        {entry.riskLabel}
                      </span>
                    </span>

                    {/* Confidence */}
                    <span className="text-muted ml-auto flex-shrink-0">
                      {Math.round(entry.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {history.length === 0 && (
            <div className="bg-base-800/40 rounded p-6 text-center">
              <Shield className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">
                No analysis history yet. Run your first analysis to start tracking.
              </p>
              <p className="text-xs text-muted/60 mt-1">
                All records are stored locally in your browser — never sent to any server.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
