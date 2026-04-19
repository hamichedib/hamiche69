import type { Channel, M3uPlaylist, StreamKind } from "./types";
import { uid } from "./utils";

/**
 * Parse an M3U/M3U8 playlist into Channel objects.
 * Detects VOD vs Live by URL extension heuristics.
 */
export function parseM3U(text: string, playlistId: string): Channel[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: Channel[] = [];
  let current: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#EXTM3U")) continue;
    if (line.startsWith("#EXTINF")) {
      const info = line.slice(line.indexOf(":") + 1);
      const commaIdx = info.lastIndexOf(",");
      const attrsStr = commaIdx >= 0 ? info.slice(0, commaIdx) : info;
      const name = commaIdx >= 0 ? info.slice(commaIdx + 1).trim() : "Unknown";
      const attrs = parseAttrs(attrsStr);
      current = {
        id: uid(),
        playlistId,
        name,
        logo: attrs["tvg-logo"],
        group: attrs["group-title"],
        tvgId: attrs["tvg-id"],
        epgChannelId: attrs["tvg-id"],
      };
      continue;
    }
    if (line.startsWith("#EXTVLCOPT") || line.startsWith("#EXTGRP")) {
      if (line.startsWith("#EXTGRP:") && current) {
        current.group = line.slice("#EXTGRP:".length).trim();
      }
      continue;
    }
    if (line.startsWith("#")) continue;
    // URL line
    if (current) {
      current.url = line;
      current.kind = detectKind(line, current.group);
      out.push(current as Channel);
      current = null;
    } else {
      // Orphan URL – create minimal entry
      out.push({
        id: uid(),
        playlistId,
        name: line,
        url: line,
        kind: detectKind(line),
      });
    }
  }
  return out;
}

function parseAttrs(input: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([A-Za-z0-9_-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
}

function detectKind(url: string, group?: string): StreamKind {
  const lower = url.toLowerCase();
  const g = (group ?? "").toLowerCase();
  if (/\/series\//.test(lower) || g.includes("series") || g.includes("مسلسل")) return "series";
  if (/\.(mp4|mkv|avi|mov|webm)(\?|$)/.test(lower)) return "movie";
  if (/\/movie\//.test(lower) || g.includes("movie") || g.includes("vod") || g.includes("film") || g.includes("فيلم") || g.includes("أفلام") || g.includes("افلام")) return "movie";
  return "live";
}

export async function loadM3uChannels(
  playlist: M3uPlaylist,
  fetcher: (url: string) => Promise<string>,
): Promise<Channel[]> {
  let text = playlist.raw ?? "";
  if (!text && playlist.url) {
    text = await fetcher(playlist.url);
  }
  if (!text) return [];
  return parseM3U(text, playlist.id);
}
