"use client";

import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Globe2 } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="fixed top-4 right-20 z-[100] flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-full shadow-lg shadow-teal-500/5">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-teal-400">
        <Globe2 size={16} />
      </div>
      <div className="flex p-0.5 bg-slate-800/50 rounded-full border border-slate-700/30">
        <button
          onClick={() => setLocale("en")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
            locale === "en"
              ? "bg-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("hi")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
            locale === "hi"
              ? "bg-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          हि
        </button>
      </div>
    </div>
  );
}
