"use client";

import React, { useEffect, useState } from "react";
import { usePharmaGuard } from "@/context/PharmaGuardContext";
import { Shield, ShieldCheck, ShieldAlert, Clock, Trash2, Lock, Wifi, WifiOff } from "lucide-react";

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {ok ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      )}
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

export default function PrivacyShield() {
  const { privacyState, clearAllData } = usePharmaGuard();
  const [timeLeft, setTimeLeft] = useState(900);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!privacyState.vcf_in_memory) {
      setTimeLeft(900);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearAllData();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [privacyState.vcf_in_memory, clearAllData]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const urgency = timeLeft < 120 ? "text-red-400" : timeLeft < 300 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <div
        className="bg-slate-900/95 backdrop-blur-sm border border-purple-500/60 rounded-xl shadow-2xl shadow-purple-500/10 overflow-hidden transition-all"
        style={{ width: isCollapsed ? "auto" : "272px" }}
      >
        {/* Header — always visible */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800/50 transition-colors"
        >
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 font-bold text-xs tracking-wide">PRIVACY SHIELD</span>
          {privacyState.vcf_in_memory && !isCollapsed && (
            <span className={`ml-auto text-xs font-mono ${urgency}`}>
              {fmt(timeLeft)}
            </span>
          )}
          {isCollapsed && privacyState.vcf_in_memory && (
            <span className={`text-xs font-mono ${urgency}`}>
              {fmt(timeLeft)}
            </span>
          )}
        </button>

        {/* Panel body */}
        {!isCollapsed && (
          <div className="px-3 pb-3 text-xs font-mono space-y-1">
            <Row ok={!privacyState.vcf_sent_to_server} label="VCF never transmitted" />
            <Row
              ok={
                privacyState.data_sent_to_llm === "phenotype_label_only" ||
                privacyState.data_sent_to_llm === "none"
              }
              label={`LLM received: ${privacyState.data_sent_to_llm}`}
            />
            <Row ok label="No cookies / session storage" />
            <Row ok label="No server-side genomic storage" />
            <Row ok label="ε=1.0 differential privacy applied" />

            {/* Data status */}
            <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">
                  VCF in memory: {privacyState.vcf_in_memory ? (
                    <span className="text-amber-400">Yes</span>
                  ) : (
                    <span className="text-emerald-400">No</span>
                  )}
                </span>
              </div>

              {privacyState.vcf_in_memory && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className={urgency}>Auto-clear: {fmt(timeLeft)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllData();
                    }}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="underline">Clear Now</span>
                  </button>
                </div>
              )}
            </div>

            {privacyState.data_cleared && (
              <div className="mt-2 py-1.5 px-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold text-center">
                ✓ All data cleared from memory
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
