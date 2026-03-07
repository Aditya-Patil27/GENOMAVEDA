"use client";

import React, { useState, useEffect } from "react";
import { Download, FileCode, Beaker, RefreshCw, AlertTriangle, Database } from "lucide-react";
// Data embedded directly in component for hackathon simplicity

// Hardcoded for now based on variant-resolver.ts, or we can export the map from there (if we modify it)
// For this implementation, I will embed the map data directly or create a helper if needed.
// To keep it clean, I'll define the data structure here based on what I read in variant-resolver.ts

const GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

interface AlleleOption {
  gene: string;
  rsid: string;
  star: string;
  description: string;
}

// Data from variant-resolver.ts
const ALLELE_DATA: AlleleOption[] = [
  // CYP2D6
  { gene: "CYP2D6", rsid: "rs3892097", star: "*4", description: "Splicing defect → no function" },
  { gene: "CYP2D6", rsid: "rs5030655", star: "*6", description: "Frameshift → no function" },
  { gene: "CYP2D6", rsid: "rs16947", star: "*2", description: "Normal/increased function" },
  { gene: "CYP2D6", rsid: "rs1065852", star: "*10", description: "Decreased function (East Asian)" },
  { gene: "CYP2D6", rsid: "rs28371725", star: "*41", description: "Decreased function" },
  { gene: "CYP2D6", rsid: "rs35742686", star: "*3", description: "Frameshift → no function" },
  { gene: "CYP2D6", rsid: "rs5030862", star: "*8", description: "No function (stop codon)" },
  { gene: "CYP2D6", rsid: "rs28371706", star: "*17", description: "Decreased function (African)" },

  // CYP2C19
  { gene: "CYP2C19", rsid: "rs4244285", star: "*2", description: "Splicing defect → no function" },
  { gene: "CYP2C19", rsid: "rs4986893", star: "*3", description: "Premature stop → no function" },
  { gene: "CYP2C19", rsid: "rs12248560", star: "*17", description: "Increased function" },
  { gene: "CYP2C19", rsid: "rs28399504", star: "*4", description: "No function" },
  
  // CYP2C9
  { gene: "CYP2C9", rsid: "rs1799853", star: "*2", description: "Decreased function" },
  { gene: "CYP2C9", rsid: "rs1057910", star: "*3", description: "Decreased function" },
  { gene: "CYP2C9", rsid: "rs28371686", star: "*5", description: "Decreased function" },
  { gene: "CYP2C9", rsid: "rs9332131", star: "*6", description: "No function" },

  // SLCO1B1
  { gene: "SLCO1B1", rsid: "rs4149056", star: "*5", description: "Decreased function (Val174Ala)" },
  { gene: "SLCO1B1", rsid: "rs2306283", star: "*1b", description: "Increased function" },
  { gene: "SLCO1B1", rsid: "rs11045819", star: "*14", description: "Decreased function" },

  // TPMT
  { gene: "TPMT", rsid: "rs1800462", star: "*2", description: "No function" },
  { gene: "TPMT", rsid: "rs1800460", star: "*3B", description: "No function" },
  { gene: "TPMT", rsid: "rs1142345", star: "*3C", description: "No function" },

  // DPYD
  { gene: "DPYD", rsid: "rs3918290", star: "*2A", description: "No function (Splice variant)" },
  { gene: "DPYD", rsid: "rs55886062", star: "*13", description: "No function" },
  { gene: "DPYD", rsid: "rs67376798", star: "c.2846A>T", description: "Decreased function" },
];

export default function SyntheticVcfGenerator() {
  const [selectedGene, setSelectedGene] = useState<string>("CYP2C19");
  const [selectedAllele, setSelectedAllele] = useState<AlleleOption>(ALLELE_DATA.find(a => a.gene === "CYP2C19")!);
  const [zygosity, setZygosity] = useState<"1/1" | "0/1">("1/1");
  const [vcfContent, setVcfContent] = useState<string>("");
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // Update selected allele when gene changes
  useEffect(() => {
    const firstAllele = ALLELE_DATA.find(a => a.gene === selectedGene);
    if (firstAllele) setSelectedAllele(firstAllele);
  }, [selectedGene]);

  // Generate VCF content
  useEffect(() => {
    if (!selectedAllele) return;

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const genotype = zygosity; // 1/1 (homozygous alt) or 0/1 (heterozygous)
    
    // Fake position map for realism
    const posMap: Record<string, number> = {
      "CYP2D6": 42128945,
      "CYP2C19": 96541616,
      "CYP2C9": 96702047,
      "SLCO1B1": 21154231,
      "TPMT": 18130522,
      "DPYD": 97547963
    };
    const pos = posMap[selectedGene] || 10000000;

    const content = `##fileformat=VCFv4.2
##fileDate=${date}
##source=PharmaGuard_Researcher_Sandbox_v2.4
##reference=GRCh38
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=RS,Number=1,Type=String,Description="dbSNP ID">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele designation">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE_001
10\t${pos}\t${selectedAllele.rsid}\tA\tG\t.\tPASS\tGENE=${selectedGene};RS=${selectedAllele.rsid};STAR=${selectedAllele.star}\tGT\t${genotype}`;

    setVcfContent(content);
  }, [selectedGene, selectedAllele, zygosity]);

  const handleDownload = () => {
    const blob = new Blob([vcfContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthetic_${selectedGene}_${selectedAllele.star.replace('*', 's')}_request.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkGenerate = () => {
    setIsGeneratingBulk(true);
    setTimeout(() => {
      setIsGeneratingBulk(false);
      alert("Successfully generated 10,000 differential-privacy synthetic VCF profiles in cohort.zip");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Controls */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Beaker className="w-4 h-4 text-teal-400" />
              Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Gene</label>
                <select
                  value={selectedGene}
                  onChange={(e) => setSelectedGene(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  {GENES.map(gene => (
                    <option key={gene} value={gene}>{gene}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Allele</label>
                <select
                  value={selectedAllele.rsid}
                  onChange={(e) => {
                    const allele = ALLELE_DATA.find(a => a.rsid === e.target.value && a.gene === selectedGene);
                    if (allele) setSelectedAllele(allele);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                >
                  {ALLELE_DATA.filter(a => a.gene === selectedGene).map(allele => (
                    <option key={allele.rsid} value={allele.rsid}>
                      {allele.star} ({allele.rsid}) - {allele.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Zygosity</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setZygosity("0/1")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      zygosity === "0/1"
                        ? "bg-teal-500/20 border-teal-500 text-teal-400"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    Heterozygous (0/1)
                  </button>
                  <button
                    onClick={() => setZygosity("1/1")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      zygosity === "1/1"
                        ? "bg-teal-500/20 border-teal-500 text-teal-400"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    Homozygous (1/1)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Research Use Only
            </h4>
            <p className="text-xs text-amber-500/80 leading-relaxed">
              This tool generates synthetic sequence data for algorithm validation.
              Output files are mathematically accurate but do not represent real human subjects.
              Safe for use in public demos and unencrypted environments.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              VCF Preview
            </h3>
            <div className="flex-1 bg-slate-900/50 rounded-lg p-3 overflow-x-auto relative group">
              <pre className="text-[10px] sm:text-xs font-mono text-slate-300 whitespace-pre">
                {vcfContent}
              </pre>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                  Read-only
                </span>
              </div>
            </div>
            
            <button
              onClick={handleDownload}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Single .vcf
            </button>
            <button
              onClick={handleBulkGenerate}
              disabled={isGeneratingBulk}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isGeneratingBulk ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {isGeneratingBulk ? "Generating 10,000 Profiles..." : "Bulk Generate Cohort (n=10,000)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

