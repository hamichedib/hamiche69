/**
 * Persistent key/value storage with graceful fallback.
 *
 * We prefer `localStorage` (always available in the WebView, no plugin
 * permissions required) and additionally try to mirror writes to the Tauri
 * Store plugin when available. Every operation is defensive: if the Tauri
 * plugin is missing, unauthorized, or throws, we silently fall back so the
 * app never loses the ability to save settings / playlists.
 */

import { isTauri } from "./utils";

interface TauriStoreLike {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  save(): Promise<void>;
}

let storePromise: Promise<TauriStoreLike | null> | null = null;

async function getStore(): Promise<TauriStoreLike | null> {
  if (!isTauri()) return null;
  if (!storePromise) {
    storePromise = (async () => {
      try {
        const mod = await import("@tauri-apps/plugin-store");
        const Store = (mod as { Store?: { load: (n: string) => Promise<TauriStoreLike> } }).Store;
        if (!Store || typeof Store.load !== "function") return null;
        return await Store.load("cinema-iptv-2026.json");
      } catch (e) {
        console.warn("[storage] tauri store unavailable, using localStorage only:", e);
        return null;
      }
    })();
  }
  return storePromise;
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[storage] lsGet("${key}") failed:`, e);
    return fallback;
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] lsSet("${key}") failed:`, e);
  }
}

export async function saveKey<T>(key: string, value: T): Promise<void> {
  // Always write to localStorage synchronously so the in-memory state is
  // persisted even if the Tauri plugin is broken.
  lsSet(key, value);
  try {
    const store = await getStore();
    if (store) {
      await store.set(key, value);
      await store.save();
    }
  } catch (e) {
    console.warn(`[storage] tauri save("${key}") failed, kept localStorage only:`, e);
  }
}

export async function loadKey<T>(key: string, fallback: T): Promise<T> {
  // Prefer Tauri store when available (first launch after upgrade that wrote
  // there), but fall back to localStorage and finally the provided default.
  try {
    const store = await getStore();
    if (store) {
      const v = await store.get(key);
      if (v !== undefined && v !== null) return v as T;
    }
  } catch (e) {
    console.warn(`[storage] tauri load("${key}") failed:`, e);
  }
  return lsGet<T>(key, fallback);
}
