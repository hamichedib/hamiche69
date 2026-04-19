import { isTauri } from "./utils";

let storePromise: Promise<unknown> | null = null;

async function getStore() {
  if (!isTauri()) return null;
  if (!storePromise) {
    storePromise = (async () => {
      const { Store } = await import("@tauri-apps/plugin-store");
      return await Store.load("cinema-iptv-2026.json");
    })();
  }
  return storePromise;
}

export async function saveKey<T>(key: string, value: T): Promise<void> {
  const store = await getStore();
  if (store && typeof (store as { set: (k: string, v: unknown) => Promise<void> }).set === "function") {
    const s = store as {
      set: (k: string, v: unknown) => Promise<void>;
      save: () => Promise<void>;
    };
    await s.set(key, value);
    await s.save();
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function loadKey<T>(key: string, fallback: T): Promise<T> {
  const store = await getStore();
  if (store && typeof (store as { get: (k: string) => Promise<unknown> }).get === "function") {
    const s = store as { get: (k: string) => Promise<unknown> };
    const v = await s.get(key);
    return (v as T) ?? fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
