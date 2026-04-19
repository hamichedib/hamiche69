import { isTauri } from "./utils";

const DEFAULT_TIMEOUT_MS = 25_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Fetch text content. Prefers Tauri HTTP plugin when available (bypasses
 * browser CORS and accepts self-signed TLS certs commonly used by IPTV
 * servers). Falls back to window.fetch outside Tauri (browser dev mode).
 */
export async function fetchText(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  if (isTauri()) {
    try {
      const { fetch } = await import("@tauri-apps/plugin-http");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": UA,
            Accept: "*/*",
          },
          // Some IPTV panels use self-signed certs or private-network IPs.
          danger: { acceptInvalidCerts: true, acceptInvalidHostnames: true },
          connectTimeout: timeoutMs,
          signal: controller.signal,
        } as Parameters<typeof fetch>[1]);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText || ""}`.trim());
        }
        return await res.text();
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      // Fall through to native fetch as a last resort.
      console.warn("[http] tauri fetch failed, trying native:", e);
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
