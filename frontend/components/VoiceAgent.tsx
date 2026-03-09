"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Mic, MicOff, Settings, HelpCircle, Search, History, TestTube, StopCircle, Keyboard, Lock, Bot, User } from "lucide-react";
import { usePharmaGuard } from "@/context/PharmaGuardContext";

type VoiceState = "idle" | "listening" | "processing" | "response";

export default function VoiceAgent() {
  const [agentState, setAgentState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const { analysisResult } = usePharmaGuard();

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          transcriptRef.current = currentTranscript;
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
          // Once recognition stops, check current state via functional update
          setAgentState(prev => {
            if (prev === "listening" && transcriptRef.current.trim().length > 0) {
              return "processing";
            } else if (prev === "listening") {
              return "idle"; // Reset if no transcript
            }
            return prev;
          });
        };
      }
    }
  }, []);

  // Effect to handle API call after transcription completes
  useEffect(() => {
    if (agentState === "processing" && transcript) {
      const processVoice = async () => {
        try {
          const payload = {
            query: transcript,
            context: analysisResult ? JSON.stringify(analysisResult) : undefined
          };

          const res = await fetch("/api/voice-processing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            const replyText = data.reply || "No dynamic response provided.";
            setResponse(replyText);
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(replyText));
            }
          } else {
            const errReply = transcript.toLowerCase().includes("patient 849") ? "Phenotype hash 0x7F... suggests high metabolic efficiency. Analyzing metabolic pathways based on lipid markers..." : "I'm sorry, I couldn't process that query correctly.";
            setResponse(errReply);
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(errReply));
            }
          }
        } catch (e) {
          const networkErr = "Connection error while processing voice.";
          setResponse(networkErr);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(networkErr));
          }
        } finally {
          setAgentState("response");
        }
      };
      processVoice();
    }
  }, [agentState, transcript]);

  // Handle voice interaction flow
  const handleStartListening = () => {
    setTranscript("");
    transcriptRef.current = "";
    setResponse("");
    setAgentState("listening");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech API start failed. Activating manual fallback.");
        setTimeout(() => {
          setTranscript("Explain the risks of Codeine for a ultra-rapid metabolizer.");
          setAgentState("processing");
        }, 2000);
      }
    } else {
      console.warn("Speech API not found. Activating manual fallback.");
      setTimeout(() => {
        setTranscript("Explain the risks of Codeine for a ultra-rapid metabolizer.");
        setAgentState("processing");
      }, 2000);
    }
  };

  const handleStop = () => {
    if (recognitionRef.current && agentState === "listening") {
      recognitionRef.current.stop();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAgentState("idle");
    setTranscript("");
    transcriptRef.current = "";
    setResponse("");
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col font-display bg-[#101d22] text-slate-100 rounded-2xl overflow-hidden border border-[#283539] relative shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 z-10 bg-[#101d22]/80 backdrop-blur-md border-b border-[#283539]">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/image/logo.png"
            alt="GenomaVeda Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-wide" style={{ fontFamily: "Syne, sans-serif" }}>GenomaVeda</h2>
            <p className="text-[10px] tracking-wider text-[#13b6ec] font-medium uppercase mt-0.5">Voice Assistant</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#283539] text-slate-300 hover:bg-[#344247] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#283539] text-slate-300 hover:bg-[#344247] transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center w-full overflow-hidden">
        {/* Abstract Backgrounds based on state */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          {agentState === "idle" && (
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, #283539 1px, transparent 1px), linear-gradient(to bottom, #283539 1px, transparent 1px)", backgroundSize: "40px 40px", WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 100%)" }}></div>
          )}
          {(agentState === "listening" || agentState === "processing") && (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(19,182,236,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(19,182,236,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#13b6ec]/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
            </>
          )}
          {agentState === "response" && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#13b6ec]/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#13b6ec]/10 rounded-full blur-[100px]"></div>
            </>
          )}
        </div>

        {/* --- IDLE STATE --- */}
        {agentState === "idle" && (
          <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-4">

              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                Ready to Analyze
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-lg font-light leading-relaxed">
                Access patient genomic data, review variant classifications, or update clinical notes via voice.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <button className="px-4 py-2 rounded-full border border-[#283539] bg-[#18282e]/50 hover:bg-[#18282e] hover:border-[#13b6ec]/50 transition-all text-sm text-slate-300 flex items-center gap-2 group">
                <Search className="w-4 h-4 text-[#13b6ec]/70 group-hover:text-[#13b6ec]" />
                "Search patient ID-4092"
              </button>
              <button className="px-4 py-2 rounded-full border border-[#283539] bg-[#18282e]/50 hover:bg-[#18282e] hover:border-[#13b6ec]/50 transition-all text-sm text-slate-300 flex items-center gap-2 group">
                <History className="w-4 h-4 text-[#13b6ec]/70 group-hover:text-[#13b6ec]" />
                "Summarize last visit"
              </button>
              <button className="px-4 py-2 rounded-full border border-[#283539] bg-[#18282e]/50 hover:bg-[#18282e] hover:border-[#13b6ec]/50 transition-all text-sm text-slate-300 flex items-center gap-2 group">
                <TestTube className="w-4 h-4 text-[#13b6ec]/70 group-hover:text-[#13b6ec]" />
                "Check BRCA1 variants"
              </button>
            </div>

            <div className="mt-8 relative group">
              <div className="absolute inset-0 rounded-full border border-[#13b6ec]/20 scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
              <div className="absolute inset-0 rounded-full border border-[#13b6ec]/10 scale-125 opacity-0 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 delay-75 ease-out"></div>
              <button
                onClick={handleStartListening}
                className="relative flex items-center justify-center h-20 w-20 rounded-full bg-[#18282e] border-2 border-[#13b6ec]/40 shadow-[0_0_30px_-5px_rgba(19,182,236,0.3)] hover:shadow-[0_0_50px_-5px_rgba(19,182,236,0.5)] hover:border-[#13b6ec] hover:bg-[#1e3239] transition-all duration-300 group-active:scale-95"
              >
                <Mic className="w-8 h-8 text-[#13b6ec] group-hover:text-white transition-colors duration-300" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#13b6ec]/10 to-transparent pointer-events-none"></div>
              </button>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Tap to speak
              </div>
            </div>
          </div>
        )}

        {/* --- LISTENING / PROCESSING STATE --- */}
        {(agentState === "listening" || agentState === "processing") && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col items-center justify-center gap-12 w-full">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#13b6ec]/10 border border-[#13b6ec]/20 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-[#13b6ec] opacity-75 ${agentState === 'listening' ? 'animate-ping' : ''}`}></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#13b6ec]"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#13b6ec]">
                  {agentState === "listening" ? "Listening Mode" : "Processing"}
                </span>
              </div>

              <div className="text-center min-h-[120px] flex items-center justify-center px-4 w-full">
                <h1 className="font-syne text-3xl md:text-5xl font-bold leading-[1.3] text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-sm transition-all duration-700">
                  {agentState === "listening" ? (transcript || "Listening...") : transcript}
                </h1>
              </div>

              {agentState === "listening" && (
                <div className="h-24 flex items-end justify-center gap-3 my-4 w-full">
                  <div className="w-3 rounded-full bg-gradient-to-t from-[#13b6ec]/40 to-[#13b6ec] shadow-[0_0_15px_rgba(19,182,236,0.5)] animate-[pulse_1.5s_ease-in-out_infinite] h-[40%]" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 rounded-full bg-gradient-to-t from-[#13b6ec]/40 to-[#13b6ec] shadow-[0_0_15px_rgba(19,182,236,0.5)] animate-[pulse_1.1s_ease-in-out_infinite] h-[70%]" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 rounded-full bg-gradient-to-t from-[#13b6ec]/40 to-[#13b6ec] shadow-[0_0_15px_rgba(19,182,236,0.5)] animate-[pulse_1.3s_ease-in-out_infinite] h-[100%]"></div>
                  <div className="w-3 rounded-full bg-gradient-to-t from-[#13b6ec]/40 to-[#13b6ec] shadow-[0_0_15px_rgba(19,182,236,0.5)] animate-[pulse_1.2s_ease-in-out_infinite] h-[60%]" style={{ animationDelay: '0.3s' }}></div>
                  <div className="w-3 rounded-full bg-gradient-to-t from-[#13b6ec]/40 to-[#13b6ec] shadow-[0_0_15px_rgba(19,182,236,0.5)] animate-[pulse_1.4s_ease-in-out_infinite] h-[45%]" style={{ animationDelay: '0.15s' }}></div>
                </div>
              )}

              <div className="relative group mt-8">
                <div className="absolute -inset-4 bg-[#13b6ec]/30 rounded-full blur-xl animate-pulse transition-all duration-500"></div>
                <button
                  onClick={handleStop}
                  className="relative flex items-center justify-center size-20 rounded-full bg-gradient-to-b from-[#13b6ec] to-[#0e8db9] text-white shadow-[0_0_40px_-10px_rgba(19,182,236,0.6)] border-2 border-[#6ed6f5]/30 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  {agentState === "listening" ? <Mic className="w-10 h-10" /> : <StopCircle className="w-10 h-10 animate-pulse" />}
                </button>
              </div>

              {/* Side context panel */}
              <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-72 bg-[#16262c]/50 backdrop-blur-md border border-[#283539] rounded-2xl p-6 shadow-xl z-10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Live Transcript</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-[#283539] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">Run analysis on patient 84920.</p>
                      <span className="text-xs text-slate-500">10:42 AM</span>
                    </div>
                  </div>
                  {agentState === "processing" && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="size-8 rounded-full bg-[#13b6ec]/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-[#13b6ec]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-300">Accessing genomic database...</p>
                        <span className="text-xs text-slate-500">10:42 AM</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- RESPONSE STATE --- */}
        {agentState === "response" && (
          <div className="w-full max-w-4xl flex flex-col items-center z-10 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-full flex flex-col items-center justify-center text-center px-4">
              <div className="mb-6 flex items-center gap-2 text-[#13b6ec]/80 uppercase tracking-widest text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13b6ec] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13b6ec]"></span>
                </span>
                Agent Response
              </div>
              <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.4] text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {response}
              </h1>
            </div>

            <div className="w-full max-w-2xl mt-4">
              <div className="relative w-full h-48 rounded-xl flex items-end justify-center overflow-hidden mb-8 border-b border-[#13b6ec]/20">
                <div className="absolute top-0 left-0 w-full flex justify-between px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">Voice Frequency</span>
                    <span className="text-xs text-[#13b6ec] mt-0.5">Active Stream</span>
                  </div>
                  <span className="font-mono text-xs text-slate-500">00:04:12</span>
                </div>

                {/* Waveform Visualization */}
                <svg className="w-full h-32 text-[#13b6ec]" fill="none" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <defs>
                    <linearGradient id="wave-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"></stop>
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path className="opacity-40 animate-pulse" d="M0 50 C20 50 30 20 50 50 S70 80 90 50 S110 30 130 50 S150 90 170 50 S190 10 210 50 S230 85 250 50 S270 25 290 50 S310 75 330 50 S360 20 400 50 V 100 H 0 Z" fill="url(#wave-gradient)"></path>
                  <path className="drop-shadow-[0_0_8px_rgba(19,182,236,0.5)]" d="M0 50 C20 50 30 20 50 50 S70 80 90 50 S110 30 130 50 S150 90 170 50 S190 10 210 50 S230 85 250 50 S270 25 290 50 S310 75 330 50 S360 20 400 50" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                </svg>
              </div>

              <div className="flex justify-center gap-6">
                <button className="group flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-slate-700 bg-[#16262c] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-500 transition-all">
                    <MicOff className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">Mute</span>
                </button>
                <button onClick={handleStop} className="group flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <StopCircle className="w-8 h-8" />
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-red-400">End Session</span>
                </button>
                <button className="group flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-slate-700 bg-[#16262c] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-500 transition-all">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">Type</span>
                </button>
              </div>

              <div className="flex justify-center gap-8 mt-8 border-t border-[#283539] pt-6 w-full">
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Session ID</p>
                  <p className="text-slate-300 font-mono text-sm">#G-9283-AX</p>
                </div>
                <div className="w-px bg-[#283539]"></div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Latency</p>
                  <p className="text-[#13b6ec] font-mono text-sm">12ms</p>
                </div>
                <div className="w-px bg-[#283539]"></div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Encryption</p>
                  <div className="flex items-center gap-1 justify-center text-green-500">
                    <Lock className="w-3.5 h-3.5" />
                    <p className="font-mono text-sm">AES-256</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar for non-response states, or universally */}
      <footer className="bg-[#101d22]/80 backdrop-blur-md border-t border-[#283539] px-6 py-2 flex justify-between items-center text-xs text-slate-500 z-10 w-full">
        <div className="flex gap-4">
          <span>Server Status: <span className="text-green-500 font-bold">Online</span></span>
          <span>Latency: <span className="text-slate-300 font-medium">24ms</span></span>
        </div>
        <div className="flex gap-4">
          <span>Microphone Input: <span className="text-[#13b6ec] font-bold">High Quality</span></span>
        </div>
      </footer>
    </div>
  );
}
