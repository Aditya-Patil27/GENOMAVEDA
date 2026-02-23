"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, ExternalLink, Loader2, AlertCircle, FileText, Database } from "lucide-react";

interface EvidenceRow {
  evidenceType: string;
  summary: string;
  score: number;
  pmid: string;
  evidenceUrl: string;
}

export default function CpicEvidenceExplorer() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const RESULTS_PER_PAGE = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/summary_ann_evidence.tsv");
        if (!response.ok) throw new Error("Failed to load evidence data");
        const text = await response.text();
        
        const lines = text.split("\n");
        const parsedData: EvidenceRow[] = [];
        
        // Skip header (line 0)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const cols = line.split("\t");
          // Columns: 0:SummaryID, 1:EvID, 2:Type, 3:URL, 4:PMID, 5:Summary, 6:Score
          if (cols.length >= 7) {
            parsedData.push({
              evidenceType: cols[2],
              evidenceUrl: cols[3],
              pmid: cols[4],
              summary: cols[5],
              score: parseFloat(cols[6]) || 0,
            });
          }
        }
        
        setData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Could not load CPIC evidence database. Please ensure the data file is available.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return data.filter((row) => 
      row.summary.toLowerCase().includes(lowerQuery) || 
      row.evidenceType.toLowerCase().includes(lowerQuery) ||
      row.pmid.includes(query)
    );
  }, [query, data]);

  const paginatedResults = useMemo(() => {
    const start = (page - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredResults, page]);

  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);

  // Helper for score badge color
  const getScoreBadge = (score: number) => {
    if (score >= 3.0) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (score >= 1.5) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    if (score > 0) return "bg-slate-700 text-slate-300 border-slate-600";
    return "bg-red-500/20 text-red-400 border-red-500/50"; // Negative or zero score
  };

  const getScoreLabel = (score: number) => {
    if (score >= 3.0) return "High Evidence";
    if (score >= 1.5) return "Moderate Evidence";
    if (score > 0) return "Low Evidence";
    return "Contradictory/No Evidence";
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by drug (e.g., 'warfarin'), gene, or clinical keyword..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // Reset to first page on new search
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Database: CPIC Summary Annotations ({data.length.toLocaleString()} entries)
          </span>
          {query && (
            <span>Found {filteredResults.length.toLocaleString()} matches</span>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto min-h-[400px] bg-slate-900/30 rounded-xl border border-slate-800 p-2 space-y-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500/50" />
            <p className="text-sm">Loading CPIC Evidence Database...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500/50" />
            <p className="text-sm text-red-500/80">{error}</p>
          </div>
        ) : !query ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Database className="w-8 h-8 text-slate-700" />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-slate-400 font-medium mb-1">Enter a search term</h3>
              <p className="text-xs">
                Explore thousands of clinical annotations from the Clinical Pharmacogenetics Implementation Consortium (CPIC).
              </p>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <FileText className="w-8 h-8 text-slate-700" />
            <p className="text-sm">No evidence found for "{query}"</p>
          </div>
        ) : (
          paginatedResults.map((item, idx) => (
            <div 
              key={`${item.pmid}-${idx}`}
              className="bg-slate-800 border border-slate-700 p-4 rounded-lg hover:border-slate-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-xs font-semibold text-teal-500 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded">
                  {item.evidenceType}
                </span>
                <div className={`px-2 py-0.5 rounded border text-[10px] font-medium uppercase ${getScoreBadge(item.score)}`}>
                  {getScoreLabel(item.score)} (Score: {item.score})
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {item.summary}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <a 
                  href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-teal-400 transition-colors"
                >
                  PMID: {item.pmid}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {item.evidenceUrl && (
                  <a 
                    href={item.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-teal-400 transition-colors"
                  >
                    View Source
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 disabled:opacity-50 hover:bg-slate-700"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-xs text-slate-500 flex items-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 disabled:opacity-50 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
