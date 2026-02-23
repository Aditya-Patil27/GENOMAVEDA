"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DRUG_GENE_MAP, getGeneForDrug } from "@/lib/drug-registry";
import { ZoomIn, ZoomOut, RefreshCw, Maximize } from "lucide-react";

interface GraphProps {
  selectedDrugs: string[];
  patientPhenotypes: Record<string, string>;
}

export default function InteractionFingerprint({ selectedDrugs, patientPhenotypes }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || selectedDrugs.length < 2) return;

    // 1. Dynamic Data Generation (No hardcoded JSON!)
    const activeDrugs = selectedDrugs.map(d => d.toUpperCase());
    
    // Identify relevant genes from the selected drugs
    const relevantGenes = new Set<string>();
    activeDrugs.forEach(drug => {
        const gene = getGeneForDrug(drug); // Uses DRUG_GENE_MAP
        if (gene) relevantGenes.add(gene);
    });

    // Build Nodes
    const geneNodes = Array.from(relevantGenes).map(gene => ({
        id: gene,
        group: "gene",
        radius: 20
    }));

    const drugNodes = activeDrugs.map(drug => ({
        id: drug,
        group: "drug",
        radius: 28
    }));

    const simNodes = [...geneNodes, ...drugNodes].map(d => ({ ...d }));

    // Build Links
    const activeLinks: any[] = [];
    activeDrugs.forEach(drug => {
        const gene = getGeneForDrug(drug);
        if (gene && relevantGenes.has(gene)) {
            activeLinks.push({
                source: drug, // d3 will map this to node object
                target: gene,
                type: "competes", // Default type for visual logic
                gene: gene // For coloring context
            });
        }
    });

    // 2. Setup SVG
    const width = containerRef.current?.clientWidth || 800;
    const height = 500;
    
    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "linear-gradient(to bottom right, #0f172a, #1e293b)") // Premium dark gradient
      .attr("class", "cursor-move");

    // Defs for Glow Effects
    const defs = svg.append("defs");
    
    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
      
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Gradient for links
    const linkGradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
      
    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#94a3b8").attr("stop-opacity", 0.2);
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#2dd4bf").attr("stop-opacity", 0.6);

    // 3. Simulation Setup
    // Physics tweak: stronger repulsion, more centered
    const simulation = d3.forceSimulation(simNodes as any)
      .force("link", d3.forceLink(activeLinks).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40).iterations(2));

    // Zoom Behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // 4. Drawing Elements
    
    // Risk coloring logic
    const getEdgeColor = (edge: any) => {
      const pheno = patientPhenotypes[edge.gene] || "NM";
      if (edge.type === "competes") {
        if (pheno === "PM" || pheno === "Poor Metabolizer") return "#ef4444"; // Red
        if (pheno === "IM" || pheno === "Intermediate Metabolizer") return "#f59e0b"; // Amber
      }
      return "#475569"; // Slate 600
    };

    const getEdgeWidth = (edge: any) => {
      const pheno = patientPhenotypes[edge.gene] || "NM";
      if (edge.type === "competes" && (pheno === "PM" || pheno === "IM")) return 3;
      return 1.5;
    };

    const link = g.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(activeLinks)
      .join("line")
      .attr("stroke", d => getEdgeColor(d))
      .attr("stroke-width", d => getEdgeWidth(d));

    const node = g.append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .call(d3.drag()
        .on("start", (e, d: any) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (e, d: any) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d: any) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    // Node Circles with Glow
    node.append("circle")
      .attr("r", (d: any) => d.group === "drug" ? 28 : 20)
      .attr("fill", (d: any) => d.group === "drug" ? "#0f172a" : "#1e293b") // Dark centers
      .attr("stroke", (d: any) => d.group === "drug" ? "#2dd4bf" : "#a78bfa") // Teal vs Purple borders
      .attr("stroke-width", 2.5)
      .style("filter", "url(#glow)") // Apply glow
      .style("cursor", "pointer");

    // Node Icons / Text
    node.append("text")
      .text((d: any) => d.group === "drug" ? "💊" : "🧬")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("font-size", (d: any) => d.group === "drug" ? "20px" : "14px")
      .style("pointer-events", "none");

    const labels = g.append("g")
      .selectAll("text")
      .data(simNodes)
      .join("text")
      .text((d: any) => d.id)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#e2e8f0")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke") // Outline effect for readability
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.group === "drug" ? 45 : 35)
      .style("pointer-events", "none")
      .style("opacity", 0.9);

    // 5. Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    // 6. Interactions (Hover)
    node.on("mouseover", (event, d: any) => {
      // Highlight connected
      const connected = new Set<string>();
      connected.add(d.id);
      activeLinks.forEach((l: any) => {
        if (l.source.id === d.id) connected.add(l.target.id);
        if (l.target.id === d.id) connected.add(l.source.id);
      });

      node.transition().duration(200).style("opacity", (n: any) => connected.has(n.id) ? 1 : 0.2);
      link.transition().duration(200).style("opacity", (l: any) => 
        (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1
      ).attr("stroke", (l: any) => 
        (l.source.id === d.id || l.target.id === d.id) ? "#2dd4bf" : getEdgeColor(l)
      ); // Highlight connection in teal
      labels.transition().duration(200).style("opacity", (n: any) => connected.has(n.id) ? 1 : 0.2);
    })
    .on("mouseout", () => {
      node.transition().duration(200).style("opacity", 1);
      link.transition().duration(200).style("opacity", 0.6).attr("stroke", d => getEdgeColor(d));
      labels.transition().duration(200).style("opacity", 0.9);
    });

  }, [selectedDrugs, patientPhenotypes]);

  if (selectedDrugs.length < 2) {
    return (
      <div className="p-8 border border-dashed border-slate-700 text-slate-400 text-center rounded-xl bg-slate-900/50 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Maximize className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium">Select 2+ drugs to visualize interaction network</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-700 pt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Interaction Fingerprint
            <span className="text-xs font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Live Physics</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic force-directed graph showing drug-gene relationships. Drag nodes to rearrange.
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
           <div className="flex items-center gap-1.5">
             <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.5)]"></span>
             <span className="text-slate-300">Drug</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(167,139,250,0.5)]"></span>
             <span className="text-slate-300">Gene</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-8 h-0.5 bg-red-500"></span>
             <span className="text-slate-300">Risk Interaction</span>
           </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-slate-900 group" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-auto touch-none block" style={{ minHeight: '500px' }}></svg>
        
        {/* Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur border border-slate-600 shadow-lg" title="Reset View">
              <RefreshCw className="w-4 h-4" onClick={() => { /* reset zoom logic if needed, simplistically handled by re-render or explicit transform reset implies more state */ }} />
           </button>
        </div>
      </div>
    </div>
  );
}
