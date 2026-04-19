import { XMLParser } from "fast-xml-parser";
import type { EpgProgram } from "./types";

function parseXmltvTime(s: string): number {
  // Format: YYYYMMDDHHmmss ±HHMM
  if (!s) return 0;
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/);
  if (!m) return Date.parse(s) || 0;
  const [, y, mo, d, h, mi, se, sign, oh, om] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}${sign ? `${sign}${oh}:${om}` : "Z"}`;
  return Date.parse(iso);
}

export function parseEpgXml(xml: string): EpgProgram[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "programme",
  });
  const doc = parser.parse(xml);
  const tv = doc?.tv;
  if (!tv) return [];
  const programmes: Array<Record<string, unknown>> = tv.programme ?? [];
  const out: EpgProgram[] = [];
  for (const p of programmes) {
    const title =
      typeof p.title === "string"
        ? p.title
        : (p.title as { ["#text"]?: string })?.["#text"] ?? "";
    const desc =
      typeof p.desc === "string"
        ? p.desc
        : (p.desc as { ["#text"]?: string })?.["#text"] ?? "";
    out.push({
      channelId: String(p["@_channel"] ?? ""),
      title,
      description: desc || undefined,
      start: parseXmltvTime(String(p["@_start"] ?? "")),
      stop: parseXmltvTime(String(p["@_stop"] ?? "")),
    });
  }
  return out;
}

export function currentAndNext(programs: EpgProgram[], now = Date.now()) {
  const sorted = programs.slice().sort((a, b) => a.start - b.start);
  const current = sorted.find((p) => p.start <= now && p.stop >= now);
  const next = sorted.find((p) => p.start > now);
  return { current, next };
}
