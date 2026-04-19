import { isTauri } from "./utils";

/**
 * Fetch text content. Uses Tauri HTTP plugin when available (bypasses CORS)
 * and falls back to window.fetch in the browser (for `npm run dev` outside Tauri).
 */
export async function fetchText(url: string): Promise<string> {
  if (isTauri()) {
    const { fetch } = await import("@tauri-apps/plugin-http");
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}
