export type PlaylistKind = "m3u" | "xtream";

export interface PlaylistBase {
  id: string;
  name: string;
  kind: PlaylistKind;
  createdAt: number;
  lastSyncAt?: number;
  epgUrl?: string;
}

export interface M3uPlaylist extends PlaylistBase {
  kind: "m3u";
  url?: string;
  filePath?: string;
  raw?: string;
}

export interface XtreamPlaylist extends PlaylistBase {
  kind: "xtream";
  host: string;
  username: string;
  password: string;
}

export type Playlist = M3uPlaylist | XtreamPlaylist;

export type StreamKind = "live" | "movie" | "series";

export interface Channel {
  id: string;
  playlistId: string;
  kind: StreamKind;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  epgChannelId?: string;
  /** For Xtream series: the series_id */
  seriesId?: string | number;
  /** For VOD & series, the preview/poster */
  poster?: string;
  plot?: string;
  rating?: number;
  year?: string;
  genre?: string;
  duration?: string;
  /** Seasons for series */
  seasons?: Season[];
}

export interface Season {
  id: number;
  name: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  url: string;
  poster?: string;
  plot?: string;
  duration?: string;
}

export interface EpgProgram {
  channelId: string;
  title: string;
  description?: string;
  start: number; // epoch ms
  stop: number;
}

export interface FavoriteKey {
  playlistId: string;
  channelId: string;
  kind: StreamKind;
}

export interface Settings {
  locale: "ar" | "en";
  parentalEnabled: boolean;
  parentalPin?: string;
  hwAccel: boolean;
  autoplay: boolean;
  bufferSeconds: number;
  accent: "rose" | "purple" | "cyan" | "gold";
  compactSidebar: boolean;
}
