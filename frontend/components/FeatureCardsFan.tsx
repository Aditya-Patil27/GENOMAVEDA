"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Brain, FlaskConical, Eye, FileText, Lock } from "lucide-react";

const CARDS = [
    {
        id: 1,
        title: "Privacy-First Genomics",
        description: "Your DNA never leaves the browser. Complete local VCF parsing and analysis.",
        icon: ShieldCheck,
        color: "#00D4FF", // cyan
        glow: "rgba(0,212,255,0.4)",
        rotation: -25,
        yOffset: 60,
        xOffset: -220,
    },
    {
        id: 2,
        title: "Dual LLM Engine",
        description: "Powered by Groq Llama-3 and Google Gemini for fast, clinical-grade reasoning.",
        icon: Brain,
        color: "#7B2FFF", // violet
        glow: "rgba(123,47,255,0.4)",
        rotation: -15,
        yOffset: 25,
        xOffset: -130,
    },
    {
        id: 3,
        title: "CPIC Guidelines",
        description: "Deterministic matching against the Clinical Pharmacogenetics Implementation Consortium.",
        icon: FlaskConical,
        color: "#00FF88", // emerald
        glow: "rgba(0,255,136,0.4)",
        rotation: -5,
        yOffset: 0,
        xOffset: -40,
    },
    {
        id: 4,
        title: "Explainable AI",
        description: "Every LLM inference is backed by a deterministic transparent audit trail.",
        icon: Eye,
        color: "#FFB800", // amber
        glow: "rgba(255,184,0,0.4)",
        rotation: 5,
        yOffset: 0,
        xOffset: 40,
    },
    {
        id: 5,
        title: "FHIR R4 Export",
        description: "Export interoperable health records directly to your healthcare provider.",
        icon: FileText,
        color: "#00E5CC", // teal
        glow: "rgba(0,229,204,0.4)",
        rotation: 15,
        yOffset: 25,
        xOffset: 130,
    },
    {
        id: 6,
        title: "Differential Privacy",
        description: "Advanced mathematical noise injection layer masking the raw genetic data.",
        icon: Lock,
        color: "#A5B4FC", // indigo text color (genomic)
        glow: "rgba(165,180,252,0.4)",
        rotation: 25,
        yOffset: 60,
        xOffset: 220,
    },
];

export default function FeatureCardsFan() {
    return (
        <div className="relative w-full h-[600px] flex items-center justify-center perspective-[1200px] my-20">
            {CARDS.map((card, index) => {
                const Icon = card.icon;

                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 150, x: 0, rotate: 0 }}
                        whileInView={{
                            opacity: 1,
                            y: card.yOffset,
                            x: card.xOffset,
                            rotate: card.rotation,
                            transition: {
                                type: "spring",
                                bounce: 0.4,
                                duration: 1.2,
                                delay: index * 0.1,
                            },
                        }}
                        viewport={{ once: true, margin: "-100px" }}
                        whileHover={{
                            y: card.yOffset - 30,
                            x: card.xOffset,
                            scale: 1.05,
                            zIndex: 50,
                            boxShadow: `0 0 40px ${card.glow}, 0 0 0 1px #1A2744`,
                            transition: { duration: 0.2 },
                        }}
                        className="absolute w-[280px] h-[380px] rounded-2xl cursor-pointer p-6 flex flex-col justify-between"
                        style={{
                            backgroundColor: "#080E1C", // bg-card
                            border: "1px solid #1A2744", // border-default
                            transformOrigin: "center 120%",
                            zIndex: 10 + index,
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
                        }}
                    >
                        {/* Card Content Top */}
                        <div>
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                                style={{ backgroundColor: `${card.color}15`, border: `1px solid ${card.color}30` }}
                            >
                                <Icon size={24} color={card.color} />
                            </div>

                            <h3 className="font-bold text-xl mb-3 text-[#F0F6FF]" style={{ fontFamily: "Syne, sans-serif" }}>
                                {card.title}
                            </h3>

                            <p className="text-[#94A3B8] text-sm leading-[1.7]">
                                {card.description}
                            </p>
                        </div>

                        {/* Flourescent border element */}
                        <div
                            className="absolute inset-0 rounded-2xl pointer-events-none opacity-20"
                            style={{
                                boxShadow: `inset 0 0 20px ${card.glow}`
                            }}
                        />

                        {/* Card Content Bottom */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-[0.2em]" style={{ color: card.color }}>
                            <span>SYSTEM</span>
                            <span>0{card.id}</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
