"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Network, ZoomIn, ZoomOut } from "lucide-react";
import edgeData from "@/data/drug-gene-edges.json";

interface InteractionFingerprintProps {
  selectedDrugs: string[];
  patientPhenotypes: Record<string, string>;
}

interface NodePos {
  id: string;
  type: "drug" | "gene";
  x: number;
  y: number;
  pheno?: string;
}

interface EdgeLine {
  from: string;
  to: string;
  type: string;
  weight: number;
  color: string;
  shared_gene?: string;
}

const phenoColors: Record<string, string> = {
  PM: "#ef4444",
  IM: "#f59e0b",
  NM: "#10b981",
  RM: "#3b82f6",
  URM: "#8b5cf6",
  Unknown: "#6b7280",
};

function getEdgeColor(
  edge: { type: string; shared_gene?: string },
  patientPhenotypes: Record<string, string>
): string {
  if (edge.type === "competes") {
    const gene = edge.shared_gene ?? "";
    const pheno = patientPhenotypes[gene];
    if (pheno === "PM") return "#ef4444";
    if (pheno === "IM") return "#f59e0b";
    return "#4b5563";
  }
  return "#334155";
}

export default function InteractionFingerprint({
  selectedDrugs,
  patientPhenotypes,
}: InteractionFingerprintProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Only show when 2+ drugs selected
  if (selectedDrugs.length < 2) return null;

  const WIDTH = 600;
  const HEIGHT = 400;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2;

  // Build nodes and edges for selected drugs
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, NodePos>();
    const relevantEdges: EdgeLine[] = [];
    const drugs = selectedDrugs.map((d) => d.toUpperCase());

    // Collect genes involved
    const involvedGenes = new Set<string>();
    const typedEdgeData = edgeData as {
      edges: Array<{ from: string; to: string; type: string; weight: number; shared_gene?: string }>;
      nodes: Record<string, { type: string; class?: string }>;
    };

    typedEdgeData.edges.forEach((e) => {
      const fromSelected = drugs.includes(e.from);
      const toSelected = drugs.includes(e.to);

      if (e.type === "metabolized_by" || e.type === "transported_by") {
        if (fromSelected) {
          involvedGenes.add(e.to);
          relevantEdges.push({
            ...e,
            color: getEdgeColor(e, patientPhenotypes),
          });
        }
      } else if (e.type === "competes") {
        if (fromSelected && toSelected) {
          relevantEdges.push({
            ...e,
            color: getEdgeColor(e, patientPhenotypes),
          });
        }
      }
    });

    // Position drug nodes in a circle
    const allNodes: string[] = [...drugs, ...Array.from(involvedGenes)];
    const drugCount = drugs.length;
    const geneArray = Array.from(involvedGenes);

    drugs.forEach((drug, i) => {
      const angle = (2 * Math.PI * i) / drugCount - Math.PI / 2;
      const radius = 130;
      nodeMap.set(drug, {
        id: drug,
        type: "drug",
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
      });
    });

    geneArray.forEach((gene, i) => {
      const angle = (2 * Math.PI * i) / geneArray.length - Math.PI / 2;
      const radius = 60;
      nodeMap.set(gene, {
        id: gene,
        type: "gene",
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
        pheno: patientPhenotypes[gene],
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: relevantEdges,
    };
  }, [selectedDrugs, patientPhenotypes, CX, CY]);

  return (
    <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-400">
          Interaction Fingerprint
        </h4>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          patient-specific • genotype-aware
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />
          <span className="text-slate-400">Drug</span>
        </span>
        {Object.entries(phenoColors).map(([pheno, color]) => (
          <span key={pheno} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span className="text-slate-400">{pheno}</span>
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-red-500 inline-block" />
          <span className="text-slate-400">High-risk competition</span>
        </span>
      </div>

      <div ref={containerRef} className="relative bg-slate-900/60 rounded-lg overflow-hidden border border-slate-700/50">
        <svg
          width="100%"
          height="400"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isDanger = edge.color === "#ef4444";
            return (
              <g key={i}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.color}
                  strokeWidth={edge.weight * 3}
                  strokeOpacity={isDanger ? 0.8 : 0.4}
                  strokeDasharray={edge.type === "competes" ? "6,3" : "none"}
                />
                {isDanger && (
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={edge.color}
                    strokeWidth={edge.weight * 6}
                    strokeOpacity={0.15}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isGene = node.type === "gene";
            const r = isGene ? 24 : 30;
            const fill = isGene
              ? (phenoColors[node.pheno ?? "Unknown"] ?? "#6b7280")
              : "#0d9488";

            return (
              <g key={node.id}>
                {/* Glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill={fill}
                  opacity={0.15}
                />
                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={isGene ? "rgba(15,23,42,0.9)" : "rgba(15,23,42,0.9)"}
                  stroke={fill}
                  strokeWidth={2}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={fill}
                  fontSize={isGene ? 9 : 8}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.id}
                </text>
                {/* Phenotype label below gene */}
                {isGene && node.pheno && (
                  <text
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fill={fill}
                    fontSize={10}
                    fontWeight={700}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.pheno}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="w-7 h-7 bg-slate-800 border border-slate-600 rounded flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
            className="w-7 h-7 bg-slate-800 border border-slate-600 rounded flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Dashed lines indicate metabolic competition. Red edges are elevated by your phenotype.
        Standard tools flag the same interactions for all patients — this graph is specific to your genotype.
      </p>
    </div>
  );
}
