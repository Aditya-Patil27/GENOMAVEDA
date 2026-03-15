"use client";

import React, { useState, useEffect } from "react";
import { Activity, ArrowRight, CornerDownRight, Database, Stethoscope, AlertOctagon } from "lucide-react";

export default function RweFeedbackLoop() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Simulate real-time stream of incoming feedback events
    const initialEvents = [
      { id: 1, time: "2m ago", gene: "CYP2D6", drug: "Tramadol", expected: "Poor Metabolizer", doctorAction: "Overrode Alert, Prescribed Anyway", outcome: "No Pain Relief (Tx Failure)" },
      { id: 2, time: "14m ago", gene: "TPMT", drug: "Azathioprine", expected: "Intermediate Metabolizer", doctorAction: "Followed Alert, Swapped Drug", outcome: "Safe Recovery" },
      { id: 3, time: "1h ago", gene: "SLCO1B1", drug: "Simvastatin", expected: "Normal Function", doctorAction: "Prescribed Standard Dose", outcome: "Myopathy Detected (Anomaly)" },
    ];
    setEvents(initialEvents);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Real-World Evidence (RWE) Feedback Loop — Demo
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Conceptual example of how live telemetry could connect prescriber behavior (EHR) with outcomes to validate CPIC guidelines
            and flag anomalies where real-world reactions diverge from genomic predictions. Numbers and events below are synthetic for demo purposes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 md:col-span-2 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Guideline Concordance (simulated)</p>
            <p className="text-3xl font-bold text-slate-100">89.4%</p>
            <p className="text-xs text-emerald-400 mt-1">Prescribers following AI alerts</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center">
             <Stethoscope className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 md:col-span-2 flex flex-col justify-center">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Clinical Override Rate (simulated)</p>
          <div className="flex items-end gap-3">
             <p className="text-3xl font-bold text-amber-400">10.6%</p>
             <p className="text-xs text-slate-400 mb-1 tracking-wide">12,403 overrides this month</p>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
             <div className="bg-amber-400 h-full w-[10.6%]"></div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h4 className="font-semibold text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" /> Telemetry Feed (synthetic events)
          </h4>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-mono">STREAMING</span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-800">
          {events.map((evt) => (
            <div key={evt.id} className="p-5 hover:bg-slate-800/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">{evt.time}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {evt.gene}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {evt.drug}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                <div className="flex-1 bg-slate-900/50 p-3 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">AI Prediction</p>
                  <p className="text-sm text-slate-300">{evt.expected}</p>
                </div>
                
                <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 shrink-0" />
                <CornerDownRight className="md:hidden w-4 h-4 text-slate-600 ml-4 shrink-0" />
                
                <div className="flex-1 bg-slate-900/50 p-3 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Doctor EHR Action</p>
                  <p className={`text-sm font-medium ${evt.doctorAction.includes('Overrode') ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {evt.doctorAction}
                  </p>
                </div>
                
                <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 shrink-0" />
                <CornerDownRight className="md:hidden w-4 h-4 text-slate-600 ml-4 shrink-0" />
                
                <div className={`flex-1 p-3 rounded border ${
                    evt.outcome.includes('Failure') || evt.outcome.includes('Anomaly') 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Clinical Outcome (RWE)</p>
                  <p className={`text-sm font-semibold flex items-center gap-2 ${
                    evt.outcome.includes('Failure') || evt.outcome.includes('Anomaly') ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {evt.outcome.includes('Anomaly') && <AlertOctagon className="w-3.5 h-3.5" />}
                    {evt.outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
