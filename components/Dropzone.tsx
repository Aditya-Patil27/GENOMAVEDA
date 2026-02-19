"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="w-full animate-slide-up stagger-2">
      <div
        {...getRootProps()}
        className={`
          relative rounded glass cursor-pointer transition-all duration-300
          p-8 text-center
          ${
            isDragActive
              ? "border-teal-400 border-2 border-glow-teal bg-teal-400/5"
              : "border border-dashed border-teal-400/30 hover:border-teal-400/60 hover:border-glow-teal"
          }
          ${error ? "border-crimson-500/50" : ""}
          ${parseResult ? "border-jade-500/50" : ""}
        `}
      >
        <input {...getInputProps()} />

        {isParsing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            <p className="text-offwhite/80">Parsing VCF file...</p>
          </div>
        ) : parseResult ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-jade-500" />
            <div>
              <p className="text-offwhite font-medium">{fileName}</p>
              <p className="text-muted text-sm mt-1">
                {(fileSize / 1024).toFixed(1)} KB • {parseResult.variants.length} variants detected
              </p>
            </div>
            {genesDetected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {genesDetected.map((gene) => (
                  <span
                    key={gene}
                    className="px-2 py-1 text-xs font-mono bg-teal-400/10 text-teal-400 border border-teal-400/20 rounded"
                  >
                    {gene}
                  </span>
                ))}
              </div>
            )}
            {parseResult.warnings.length > 0 && (
              <div className="mt-2 text-amber-500 text-xs">
                {parseResult.warnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}
            <p className="text-muted text-xs mt-2">Drop another file to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-400/5 border border-teal-400/20 flex items-center justify-center">
              {isDragActive ? (
                <FileText className="w-8 h-8 text-teal-400 animate-bounce" />
              ) : (
                <Upload className="w-8 h-8 text-teal-400/60" />
              )}
            </div>
            <div>
              <p className="text-offwhite font-medium">
                {isDragActive ? "Drop VCF file here" : "Upload VCF File"}
              </p>
              <p className="text-muted text-sm mt-1">
                Drag & drop or click to select • .vcf format • Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-crimson-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
