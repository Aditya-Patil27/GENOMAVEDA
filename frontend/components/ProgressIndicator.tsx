"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Upload, Pill, FileText, Check } from "lucide-react";

const steps = [
  { id: 1, name: "Upload VCF", path: "/upload", icon: Upload },
  { id: 2, name: "Select Drug", path: "/select-drug", icon: Pill },
  { id: 3, name: "View Report", path: "/report", icon: FileText },
];

export default function ProgressIndicator() {
  const pathname = usePathname();

  const getCurrentStep = () => {
    if (pathname === "/upload") return 1;
    if (pathname === "/select-drug") return 2;
    if (pathname === "/report") return 3;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="w-full bg-slate-800/50 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isPending = step.id > currentStep;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                {/* Step */}
                <div className="flex items-center gap-3">
                  {/* Icon Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${
                        isCompleted
                          ? "bg-teal-500 border-teal-500"
                          : isActive
                          ? "bg-teal-500/10 border-teal-500"
                          : "bg-slate-700/50 border-slate-600"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-teal-500" : "text-slate-400"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Info */}
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-teal-400"
                          : isCompleted
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Step {step.id}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isActive
                          ? "text-slate-100"
                          : isCompleted
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-0.5 transition-all ${
                        step.id < currentStep
                          ? "bg-teal-500"
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
