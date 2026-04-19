import { create } from "zustand";
import type {
  Channel,
  EpgProgram,
  FavoriteKey,
  Playlist,
  Settings,
  StreamKind,
} from "../lib/types";
import { loadKey, saveKey } from "../lib/storage";
import { fetchText } from "../lib/http";
import { loadM3uChannels } from "../lib/m3u";
import { loadXtreamChannels, loadSeriesSeasons } from "../lib/xtream";
import { parseEpgXml } from "../lib/epg";

interface AppState {
  ready: boolean;

  playlists: Playlist[];
  activePlaylistId: string | null;

  channels: Channel[];
  loadingChannels: boolean;
  loadError?: string;

  epgByChannel: Record<string, EpgProgram[]>;
  loadingEpg: boolean;

  favorites: FavoriteKey[];
  recents: FavoriteKey[];

  settings: Settings;

  nowPlaying: Channel | null;
  nowPlayingUrlOverride?: string;

  // actions
  init: () => Promise<void>;
  addPlaylist: (p: Playlist) => Promise<void>;
  removePlaylist: (id: string) => Promise<void>;
  setActivePlaylist: (id: string | null) => Promise<void>;
  syncActivePlaylist: () => Promise<void>;
  loadEpgFor: (playlist: Playlist) => Promise<void>;
  toggleFavorite: (ch: Channel) => Promise<void>;
  isFavorite: (ch: Channel) => boolean;
  pushRecent: (ch: Channel) => Promise<void>;
  setNowPlaying: (ch: Channel | null, urlOverride?: string) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  fetchSeasons: (ch: Channel) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  locale: "ar",
  parentalEnabled: false,
  hwAccel: true,
  autoplay: true,
  bufferSeconds: 30,
  accent: "rose",
  compactSidebar: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  playlists: [],
  activePlaylistId: null,
  channels: [],
  loadingChannels: false,
  epgByChannel: {},
  loadingEpg: false,
  favorites: [],
  recents: [],
  settings: DEFAULT_SETTINGS,
  nowPlaying: null,

  init: async () => {
    // Defensive: each load is independent so one corrupt/unavailable key
    // cannot prevent the app from becoming ready.
    const safe = async <T>(k: string, fb: T): Promise<T> => {
      try {
        return await loadKey<T>(k, fb);
      } catch (e) {
        console.warn(`[init] load "${k}" failed, using default:`, e);
        return fb;
      }
    };
    const [playlists, activePlaylistId, favorites, recents, settings] = await Promise.all([
      safe<Playlist[]>("playlists", []),
      safe<string | null>("activePlaylistId", null),
      safe<FavoriteKey[]>("favorites", []),
      safe<FavoriteKey[]>("recents", []),
      safe<Settings>("settings", DEFAULT_SETTINGS),
    ]);
    set({
      playlists: Array.isArray(playlists) ? playlists : [],
      activePlaylistId,
      favorites: Array.isArray(favorites) ? favorites : [],
      recents: Array.isArray(recents) ? recents : [],
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
      ready: true,
    });
    if (activePlaylistId && (playlists ?? []).find((p) => p.id === activePlaylistId)) {
      void get().syncActivePlaylist();
    }
  },

  addPlaylist: async (p) => {
    const playlists = [...get().playlists, p];
    set({ playlists, activePlaylistId: p.id });
    await Promise.all([saveKey("playlists", playlists), saveKey("activePlaylistId", p.id)]);
    void get().syncActivePlaylist();
  },

  removePlaylist: async (id) => {
    const playlists = get().playlists.filter((p) => p.id !== id);
    const active = get().activePlaylistId === id ? playlists[0]?.id ?? null : get().activePlaylistId;
    set({
      playlists,
      activePlaylistId: active,
      channels: active ? get().channels.filter((c) => c.playlistId === active) : [],
    });
    await Promise.all([saveKey("playlists", playlists), saveKey("activePlaylistId", active)]);
    if (active) void get().syncActivePlaylist();
  },

  setActivePlaylist: async (id) => {
    set({ activePlaylistId: id });
    await saveKey("activePlaylistId", id);
    if (id) void get().syncActivePlaylist();
  },

  syncActivePlaylist: async () => {
    const { activePlaylistId, playlists } = get();
    const pl = playlists.find((p) => p.id === activePlaylistId);
    if (!pl) return;
    set({ loadingChannels: true, loadError: undefined });
    try {
      const channels =
        pl.kind === "m3u"
          ? await loadM3uChannels(pl, fetchText)
          : await loadXtreamChannels(pl, fetchText);
      set({ channels, loadingChannels: false });
      const playlists2 = get().playlists.map((p) =>
        p.id === pl.id ? { ...p, lastSyncAt: Date.now() } : p,
      );
      set({ playlists: playlists2 });
      await saveKey("playlists", playlists2);
      if (pl.epgUrl) void get().loadEpgFor(pl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ loadingChannels: false, loadError: msg });
    }
  },

  loadEpgFor: async (pl) => {
    if (!pl.epgUrl) return;
    set({ loadingEpg: true });
    try {
      const xml = await fetchText(pl.epgUrl);
      const programs = parseEpgXml(xml);
      const byChannel: Record<string, EpgProgram[]> = {};
      for (const p of programs) {
        if (!byChannel[p.channelId]) byChannel[p.channelId] = [];
        byChannel[p.channelId].push(p);
      }
      set({ epgByChannel: byChannel, loadingEpg: false });
    } catch {
      set({ loadingEpg: false });
    }
  },

  toggleFavorite: async (ch) => {
    const key: FavoriteKey = { playlistId: ch.playlistId, channelId: ch.id, kind: ch.kind };
    const existing = get().favorites.find(
      (f) => f.playlistId === key.playlistId && f.channelId === key.channelId,
    );
    const favorites = existing
      ? get().favorites.filter((f) => !(f.playlistId === key.playlistId && f.channelId === key.channelId))
      : [...get().favorites, key];
    set({ favorites });
    await saveKey("favorites", favorites);
  },

  isFavorite: (ch) =>
    get().favorites.some((f) => f.playlistId === ch.playlistId && f.channelId === ch.id),

  pushRecent: async (ch) => {
    const key: FavoriteKey = { playlistId: ch.playlistId, channelId: ch.id, kind: ch.kind };
    const others = get().recents.filter(
      (r) => !(r.playlistId === key.playlistId && r.channelId === key.channelId),
    );
    const recents = [key, ...others].slice(0, 30);
    set({ recents });
    await saveKey("recents", recents);
  },

  setNowPlaying: (ch, urlOverride) => {
    set({ nowPlaying: ch, nowPlayingUrlOverride: urlOverride });
    if (ch) void get().pushRecent(ch);
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await saveKey("settings", settings);
  },

  fetchSeasons: async (ch) => {
    if (ch.kind !== "series" || ch.seasons) return;
    const pl = get().playlists.find((p) => p.id === ch.playlistId);
    if (!pl || pl.kind !== "xtream" || !ch.seriesId) return;
    try {
      const seasons = await loadSeriesSeasons(pl, ch.seriesId, fetchText);
      set({
        channels: get().channels.map((c) => (c.id === ch.id ? { ...c, seasons } : c)),
      });
    } catch {
      // ignore
    }
  },
}));

/** Convenience selector for channels filtered by kind. */
export function useChannelsByKind(kind: StreamKind): Channel[] {
  return useAppStore((s) => s.channels.filter((c) => c.kind === kind));
}
