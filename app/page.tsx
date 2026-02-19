"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PlasmaBackground from "@/components/PlasmaBackground";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/upload");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Plasma Animation Background */}
      <div className="absolute inset-0 z-0">
        <PlasmaBackground
          color="#ffffff"
          speed={0.6}
          direction="forward"
          scale={1}
          opacity={0.8}
          mouseInteractive={true}
        />
      </div>

      {/* Logo and Animated Title Text */}
      <div className="relative z-10 text-center animate-fade-in-scale">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/assets/image/logo.png"
            alt="GenomaVeda Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight">
          GenomaVeda
        </h1>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-scale {
          animation: fadeInScale 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
