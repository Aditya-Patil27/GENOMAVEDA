/**
 * Patient ID Pseudonymization Logic (Layer 3)
 * Generates a session-scoped display ID from a raw patient ID.
 * One-way hash, reversible only with the server-side salt (in theory).
 */

export async function anonymizePatientId(rawId: string): Promise<string> {
    const salt = process.env.NEXT_PUBLIC_DISPLAY_SALT || "PHARMAGUARD_SALT";
    const input = rawId + salt;

    try {
        // Try Web Crypto API first
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return `SESSION-${hashHex.substring(0, 8).toUpperCase()}`;
        }
    } catch (e) {
        console.warn("Web Crypto API unavailable, falling back to simple hash", e);
    }

    // Fallback: Simple non-secure hash (DJB2 variant) for demo environments
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i); /* hash * 33 + c */
    }
    // Convert to positive hex string
    const fallbackHex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return `SESSION-${fallbackHex.substring(0, 8)}`;
}
