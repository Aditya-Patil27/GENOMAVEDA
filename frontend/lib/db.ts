import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PharmaGuardDB extends DBSchema {
  vault: {
    key: string;
    value: {
      id: string; // "phenotype"
      hash: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'PharmaGuardVault';
const STORE_NAME = 'vault';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PharmaGuardDB>> | null = null;

export async function initDB() {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<PharmaGuardDB>(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveToVault(id: string, data: any) {
  const db = await initDB();
  if (!db) return;
  
  // Create a pseudo-hash to represent mathematical hashing as per PRD
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  let hashHex = "";

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for SSR or environments without crypto.subtle
    const cryptoModule = await import("crypto");
    hashHex = cryptoModule.createHash("sha256").update(dataString).digest("hex");
  }

  await db.put(STORE_NAME, {
    id,
    hash: hashHex,
    data, // We store the data but in a real fully zero-persistence model we might only keep the hash if we don't need the phenotypes again, but we NEED the phenotypes for the risk engine. The 'raw VCF' is what gets discarded.
    timestamp: Date.now(),
  });
}

export async function getFromVault(id: string) {
  const db = await initDB();
  if (!db) return null;
  return db.get(STORE_NAME, id);
}

export async function checkEviction(): Promise<boolean> {
  const db = await initDB();
  if (!db) return false;
  // If we expect data but it's empty, or just checking storage persistence
  try {
    if (navigator.storage && navigator.storage.persisted) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        // Try to persist
        await navigator.storage.persist();
      }
    }
    return true;
  } catch (e) {
    console.warn("Storage check failed", e);
    return false;
  }
}

export async function clearVault() {
  const db = await initDB();
  if (!db) return;
  await db.clear(STORE_NAME);
}

// Check if running in private browsing mode (heuristic)
export async function isPrivateBrowsing(): Promise<boolean> {
  return new Promise((resolve) => {
    const on = () => resolve(true);
    const off = () => resolve(false);
    
    // Quick heuristic for Safari/Chrome incognito using quota
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.quota && estimate.quota < 120000000) {
          on();
        } else {
          off();
        }
      }).catch(off);
    } else {
      off(); // Default to false if we can't tell
    }
  });
}
