import { Command, type Child } from "@tauri-apps/plugin-shell";

export interface PlayOptions {
  title?: string;
  userAgent?: string;
  referer?: string;
  live?: boolean;
}

export interface PlaySession {
  stop: () => Promise<void>;
  wait: Promise<number>;
}

const MPV_FALLBACK_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function buildArgs(url: string, opts: PlayOptions): string[] {
  const title = opts.title ?? "Cinema IPTV 2026";
  const ua = opts.userAgent ?? MPV_FALLBACK_UA;
  const args: string[] = [
    url,
    "--force-window=immediate",
    `--title=${title}`,
    `--user-agent=${ua}`,
    "--hwdec=auto-safe",
    "--cache=yes",
    "--cache-secs=15",
    "--demuxer-max-bytes=50MiB",
    "--demuxer-max-back-bytes=25MiB",
    "--network-timeout=20",
    "--keep-open=yes",
    "--osd-bar=yes",
    "--osc=yes",
    "--input-default-bindings=yes",
    "--input-vo-keyboard=yes",
    "--tls-verify=no",
  ];
  if (opts.referer) args.push(`--referrer=${opts.referer}`);
  if (opts.live) {
    args.push("--profile=low-latency");
  }
  return args;
}

/**
 * Launch the bundled mpv binary to play a stream URL.
 * mpv opens in its own native window — the most reliable way to play
 * arbitrary IPTV streams (HLS, MPEG-TS, RTMP, UDP, etc.).
 */
export async function playStream(url: string, opts: PlayOptions = {}): Promise<PlaySession> {
  const cmd = Command.sidecar("binaries/mpv", buildArgs(url, opts));
  let child: Child | null = null;
  const wait = new Promise<number>((resolve) => {
    cmd.on("close", (data: { code?: number | null }) => resolve(data.code ?? 0));
    cmd.on("error", (err) => {
      console.error("[mpv] error", err);
      resolve(-1);
    });
  });
  cmd.stdout.on("data", (line) => console.log("[mpv:out]", line));
  cmd.stderr.on("data", (line) => console.log("[mpv:err]", line));
  child = await cmd.spawn();
  return {
    stop: async () => {
      try {
        if (child) await child.kill();
      } catch (e) {
        console.warn("[mpv] kill failed", e);
      }
    },
    wait,
  };
}
