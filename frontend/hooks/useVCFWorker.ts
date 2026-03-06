import { useCallback, useRef } from "react";
import type { ParsedVCF } from "@/lib/vcf-parser";

type WorkerStatus = "idle" | "parsing" | "done" | "error";

interface UseVCFWorkerResult {
  parseVCF: (content: string) => Promise<ParsedVCF>;
  status: WorkerStatus;
}

export function useVCFWorker(): UseVCFWorkerResult {
  const statusRef = useRef<WorkerStatus>("idle");

  const parseVCF = useCallback((content: string): Promise<ParsedVCF> => {
    return new Promise((resolve, reject) => {
      if (typeof Worker === "undefined") {
        // SSR fallback — import synchronously
        import("@/lib/vcf-parser").then(({ parseVCF: parseSync }) => {
          resolve(parseSync(content));
        });
        return;
      }

      statusRef.current = "parsing";
      const worker = new Worker(
        new URL("../../workers/vcf-parser.worker.ts", import.meta.url),
        { type: "module" }
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        statusRef.current = "error";
        reject(new Error("VCF parsing timed out (>30s). File may be too large."));
      }, 30_000);

      worker.onmessage = (event: MessageEvent<ParsedVCF>) => {
        clearTimeout(timeout);
        worker.terminate();
        statusRef.current = "done";
        resolve(event.data);
      };

      worker.onerror = (err) => {
        clearTimeout(timeout);
        worker.terminate();
        statusRef.current = "error";
        reject(new Error(err.message || "VCF worker error"));
      };

      worker.postMessage(content);
    });
  }, []);

  return { parseVCF, status: statusRef.current };
}
