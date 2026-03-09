"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown, Mic } from "lucide-react";
import { usePharmaGuard } from "@/context/PharmaGuardContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What is a CYP2D6 Poor Metabolizer?",
  "Is Codeine safe for poor metabolizers?",
  "Explain CYP2C19 and Clopidogrel interaction",
  "What does my risk report mean?",
];

export default function PharmaGuardChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Genomaveda AI 💊\n\nI can answer your questions about drug-gene interactions, metabolizer types, and CPIC guidelines. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { analysisResult } = usePharmaGuard();

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setInput("");
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      const history = messages.slice(-8);

      const payload = {
        message: text.trim(),
        history,
        context: analysisResult ? JSON.stringify(analysisResult) : undefined
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const replyText = data.reply || "I couldn't get a response. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(replyText);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      const errorMsg = "Connection error. Please check your internet and try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(errorMsg);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          id="chatbot-trigger"
          className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold rounded-full shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Ask Genomaveda AI</span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          id="chatbot-panel"
          className="fixed bottom-6 right-6 z-[200] flex flex-col w-[380px] max-w-[calc(100vw-24px)] h-[520px] max-h-[calc(100vh-48px)] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Genomaveda AI</p>
                <p className="text-xs text-teal-400">Pharmacogenomics Assistant</p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); window.speechSynthesis?.cancel(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                    ? "bg-teal-500 text-slate-900 font-medium rounded-br-sm"
                    : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only before first user message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-col gap-1.5 shrink-0">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-500/40 transition-colors truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
            >
              <input
                id="chatbot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a drug or gene..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={toggleListen}
                disabled={loading}
                title="Voice Input"
                className={`w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-lg transition-colors ${isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || loading || isListening}
                className="w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-lg bg-teal-500 disabled:opacity-40 hover:bg-teal-400 transition-colors text-slate-900"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-xs text-slate-600 text-center mt-1.5">
              Educational only — not clinical advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
