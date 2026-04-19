import type { Channel, Episode, Season, XtreamPlaylist } from "./types";
import { uid } from "./utils";

type Fetcher = (url: string) => Promise<string>;

function base(p: XtreamPlaylist): string {
  const host = p.host.replace(/\/$/, "");
  const hasProtocol = /^https?:\/\//i.test(host);
  return hasProtocol ? host : `http://${host}`;
}

function api(p: XtreamPlaylist, action: string, extra: Record<string, string | number> = {}): string {
  const params = new URLSearchParams({
    username: p.username,
    password: p.password,
    action,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  });
  return `${base(p)}/player_api.php?${params.toString()}`;
}

async function get<T>(url: string, fetcher: Fetcher): Promise<T> {
  const text = await fetcher(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    return [] as unknown as T;
  }
}

interface XCategory { category_id: string; category_name: string; }
interface XLive { stream_id: number; name: string; stream_icon?: string; category_id?: string; epg_channel_id?: string; }
interface XVod { stream_id: number; name: string; stream_icon?: string; category_id?: string; rating?: string; year?: string; plot?: string; genre?: string; container_extension?: string; }
interface XSeries { series_id: number; name: string; cover?: string; category_id?: string; plot?: string; genre?: string; rating?: string; releaseDate?: string; }
interface XSeriesInfoSeason { season_number?: number; name?: string; air_date?: string; cover?: string; }
interface XSeriesInfoEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension?: string;
  info?: { duration?: string; plot?: string; movie_image?: string };
}
interface XSeriesInfo {
  seasons?: XSeriesInfoSeason[];
  info?: { name?: string; plot?: string; cover?: string };
  episodes?: Record<string, XSeriesInfoEpisode[]>;
}

export async function xtreamAuth(p: XtreamPlaylist, fetcher: Fetcher): Promise<boolean> {
  const url = `${base(p)}/player_api.php?username=${encodeURIComponent(p.username)}&password=${encodeURIComponent(p.password)}`;
  try {
    const res = await get<{ user_info?: { auth?: number } }>(url, fetcher);
    return Boolean(res?.user_info && Number(res.user_info.auth) === 1);
  } catch {
    return false;
  }
}

export async function loadXtreamChannels(p: XtreamPlaylist, fetcher: Fetcher): Promise<Channel[]> {
  const [liveCats, vodCats, seriesCats, live, vod, series] = await Promise.all([
    get<XCategory[]>(api(p, "get_live_categories"), fetcher),
    get<XCategory[]>(api(p, "get_vod_categories"), fetcher),
    get<XCategory[]>(api(p, "get_series_categories"), fetcher),
    get<XLive[]>(api(p, "get_live_streams"), fetcher),
    get<XVod[]>(api(p, "get_vod_streams"), fetcher),
    get<XSeries[]>(api(p, "get_series"), fetcher),
  ]);

  const liveCatMap = new Map((liveCats ?? []).map((c) => [String(c.category_id), c.category_name]));
  const vodCatMap = new Map((vodCats ?? []).map((c) => [String(c.category_id), c.category_name]));
  const seriesCatMap = new Map((seriesCats ?? []).map((c) => [String(c.category_id), c.category_name]));

  const out: Channel[] = [];

  for (const s of live ?? []) {
    out.push({
      id: `live-${s.stream_id}`,
      playlistId: p.id,
      kind: "live",
      name: s.name,
      url: `${base(p)}/live/${p.username}/${p.password}/${s.stream_id}.m3u8`,
      logo: s.stream_icon,
      group: s.category_id ? liveCatMap.get(String(s.category_id)) ?? "Live" : "Live",
      epgChannelId: s.epg_channel_id,
      tvgId: s.epg_channel_id,
    });
  }

  for (const v of vod ?? []) {
    const ext = v.container_extension || "mp4";
    out.push({
      id: `vod-${v.stream_id}`,
      playlistId: p.id,
      kind: "movie",
      name: v.name,
      url: `${base(p)}/movie/${p.username}/${p.password}/${v.stream_id}.${ext}`,
      poster: v.stream_icon,
      group: v.category_id ? vodCatMap.get(String(v.category_id)) ?? "Movies" : "Movies",
      plot: v.plot,
      rating: v.rating ? Number(v.rating) : undefined,
      year: v.year,
      genre: v.genre,
    });
  }

  for (const s of series ?? []) {
    out.push({
      id: `series-${s.series_id}`,
      playlistId: p.id,
      kind: "series",
      name: s.name,
      url: "", // URL resolved per-episode
      seriesId: s.series_id,
      poster: s.cover,
      group: s.category_id ? seriesCatMap.get(String(s.category_id)) ?? "Series" : "Series",
      plot: s.plot,
      rating: s.rating ? Number(s.rating) : undefined,
      year: s.releaseDate?.slice(0, 4),
      genre: s.genre,
    });
  }

  return out;
}

export async function loadSeriesSeasons(
  p: XtreamPlaylist,
  seriesId: string | number,
  fetcher: Fetcher,
): Promise<Season[]> {
  const info = await get<XSeriesInfo>(api(p, "get_series_info", { series_id: seriesId }), fetcher);
  const out: Season[] = [];
  if (!info?.episodes) return out;
  for (const [seasonKey, eps] of Object.entries(info.episodes)) {
    const seasonNum = Number(seasonKey);
    const meta = info.seasons?.find((s) => s.season_number === seasonNum);
    const episodes: Episode[] = (eps ?? []).map((e) => ({
      id: `ep-${e.id ?? uid()}`,
      season: seasonNum,
      episode: Number(e.episode_num) || 0,
      title: e.title,
      url: `${base(p)}/series/${p.username}/${p.password}/${e.id}.${e.container_extension || "mp4"}`,
      poster: e.info?.movie_image,
      plot: e.info?.plot,
      duration: e.info?.duration,
    }));
    out.push({
      id: seasonNum,
      name: meta?.name ?? `Season ${seasonNum}`,
      episodes: episodes.sort((a, b) => a.episode - b.episode),
    });
  }
  return out.sort((a, b) => a.id - b.id);
}
