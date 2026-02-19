"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { ParsedVCF } from "@/lib/vcf-parser";

interface DropzoneProps {
  onFileLoaded: (content: string, fileName: string, parsedVCF: ParsedVCF) => void;
  parseVCF: (content: string) => ParsedVCF;
}

export default function Dropzone({ onFileLoaded, parseVCF }: DropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedVCF | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { message: string }[] }[]) => {
      setError(null);
      setParseResult(null);

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        setError(err.message || "Invalid file type. Only .vcf files are accepted.");
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Check extension
      if (!file.name.toLowerCase().endsWith(".vcf")) {
        setError("Invalid file type. Only .vcf files are accepted.");
        return;
      }

      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setError("File exceeds 5MB limit. Please use a smaller VCF file.");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setIsParsing(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const parsed = parseVCF(content);
          setParseResult(parsed);
          setIsParsing(false);
          onFileLoaded(content, file.name, parsed);
        } catch {
          setError("Failed to parse VCF file. Please check the file format.");
          setIsParsing(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setIsParsing(false);
      };
      reader.readAsText(file);
    },
    [onFileLoaded, parseVCF]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".vcf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const genesDetected = parseResult
    ? [...new Set(parseResult.variants.map((v) => v.gene))]
    : [];

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative rounded-lg cursor-pointer transition-all border-2 border-dashed p-8 text-center
          ${
            isDragActive
              ? "border-teal-500 bg-teal-500/5"
              : parseResult
              ? "border-teal-500/50 bg-teal-500/5"
              : error
              ? "border-red-500/50 bg-red-500/5"
              : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
          }
        `}
      >
        <input {...getInputProps()} />

        {isParsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            <p className="text-sm text-slate-300">Parsing VCF file...</p>
          </div>
        ) : parseResult ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-teal-500" />
            <div>
              <p className="text-sm font-medium text-slate-200">{fileName}</p>
              <p className="text-xs text-slate-400 mt-1">
                {(fileSize / 1024).toFixed(1)} KB • {parseResult.variants.length} variants detected
              </p>
            </div>
            {genesDetected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {genesDetected.map((gene) => (
                  <span
                    key={gene}
                    className="px-2 py-1 text-xs font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded"
                  >
                    {gene}
                  </span>
                ))}
              </div>
            )}
            {parseResult.warnings.length > 0 && (
              <div className="mt-2 text-amber-400 text-xs">
                {parseResult.warnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Drop another file to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
              {isDragActive ? (
                <FileText className="w-6 h-6 text-teal-500" />
              ) : (
                <Upload className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isDragActive ? "Drop VCF file here" : "Drag & drop or click to select"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports compressed VCF.GZ • Max 5MB
              </p>
            </div>
            <button
              type="button"
              className="mt-2 px-4 py-2 text-xs font-medium bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
            >
              Select File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
