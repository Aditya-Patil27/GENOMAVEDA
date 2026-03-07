import { openDB, DBSchema, IDBPDatabase } from "idb";

// ─── Typed vault schema ───────────────────────────────────────────────────────

/** Typed vault record — add new field shapes here as features grow */
export type VaultData =
  | { type: "phenotype"; gene: string; diplotype: string; phenotype: string }
  | { type: "analysis_result"; drug: string; risk_label: string; confidence_score: number }
  | { type: "vcf_summary"; variant_count: number; genes_detected: string[] }
  | { type: "vcf_session"; patient_id: string; phenotype_profiles: { gene: string; diplotype: string; phenotype: string }[] };


interface VaultRecord {
  id: string;
  hash: string;
  data: VaultData;
  timestamp: number;
}

interface PharmaGuardDB extends DBSchema {
  vault: {
    key: string;
    value: VaultRecord;
  };
}

// ─── DB singleton ─────────────────────────────────────────────────────────────
const DB_NAME = "PharmaGuardVault";
const STORE_NAME = "vault";
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PharmaGuardDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<PharmaGuardDB> | null> {
  if (typeof window === "undefined") return null;

  if (!dbPromise) {
    dbPromise = openDB<PharmaGuardDB>(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────
export async function saveToVault(id: string, data: VaultData): Promise<void> {
  const db = await initDB();
  if (!db) return;

  let hashHex = "";
  const dataString = JSON.stringify(data);
  const encoder = new TextEncoder();

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(dataString));
    hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Server-side fallback (should not be reached — db only initialises in browser)
    const cryptoModule = await import("crypto");
    hashHex = cryptoModule.createHash("sha256").update(dataString).digest("hex");
  }

  await db.put(STORE_NAME, { id, hash: hashHex, data, timestamp: Date.now() });
}

export async function getFromVault(id: string): Promise<VaultRecord | undefined> {
  const db = await initDB();
  if (!db) return undefined;
  return db.get(STORE_NAME, id);
}

export async function clearVault(): Promise<void> {
  const db = await initDB();
  if (!db) return;
  await db.clear(STORE_NAME);
}

// ─── Storage utilities ────────────────────────────────────────────────────────
export async function checkEviction(): Promise<boolean> {
  const db = await initDB();
  if (!db) return false;
  try {
    if (navigator.storage?.persisted) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
    return true;
  } catch (e) {
    console.warn("Storage persistence check failed:", e);
    return false;
  }
}

/**
 * Heuristic check for private browsing mode.
 * Based on storage quota — private mode typically caps at ~120 MB.
 * Not reliable across all browsers; treat as best-effort signal.
 */
export async function isPrivateBrowsing(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.storage?.estimate) {
      resolve(false);
      return;
    }
    navigator.storage
      .estimate()
      .then((estimate) => {
        resolve(!!estimate.quota && estimate.quota < 120_000_000);
      })
      .catch(() => resolve(false));
  });
}
