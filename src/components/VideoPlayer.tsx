import Hls from "hls.js";
import mpegts from "mpegts.js";
import {
  Maximize2,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
  X,
  RotateCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDuration, cn } from "../lib/utils";

type MpegtsPlayer = {
  attachMediaElement: (el: HTMLMediaElement) => void;
  load: () => void;
  play: () => Promise<void> | void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
};

function detectKind(url: string): "hls" | "mpegts" | "native" {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".m3u8")) return "hls";
  if (u.endsWith(".ts") || u.endsWith(".mts") || u.endsWith(".m2ts")) return "mpegts";
  if (/\/live\//.test(u) && !u.endsWith(".mp4")) return "mpegts";
  return "native";
}

interface Props {
  src: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
  autoplay?: boolean;
  live?: boolean;
}

export function VideoPlayer({ src, title, poster, onClose, autoplay = true, live = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<MpegtsPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    setErrorMsg(null);
    setBuffering(true);

    // Clean up previous players
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch {
        /* ignore */
      }
      mpegtsRef.current = null;
    }

    const kind = detectKind(src);
    const canNativeHls = v.canPlayType("application/vnd.apple.mpegurl");

    const attachNative = () => {
      v.src = src;
      v.load();
      if (autoplay) void v.play().catch(() => undefined);
    };

    if (kind === "hls") {
      if (canNativeHls) {
        attachNative();
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: live,
          maxBufferLength: 30,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) void v.play().catch(() => undefined);
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            // Fallback: try native <video> src as last resort.
            try {
              hls.destroy();
            } catch {
              /* ignore */
            }
            hlsRef.current = null;
            const msg = `HLS ${data.type}: ${data.details ?? "fatal"}`;
            console.error("[player]", msg, data);
            attachNative();
            setErrorMsg(
              `فشل HLS (${data.details ?? data.type}). جاري تجربة التشغيل المباشر.`,
            );
          }
        });
      } else {
        attachNative();
      }
    } else if (kind === "mpegts" && mpegts.getFeatureList().mseLivePlayback) {
      const player = mpegts.createPlayer(
        {
          type: "mpegts",
          url: src,
          isLive: live,
          cors: true,
          withCredentials: false,
        },
        {
          enableWorker: true,
          enableStashBuffer: !live,
          stashInitialSize: live ? 128 : undefined,
          liveBufferLatencyChasing: live,
          liveBufferLatencyMaxLatency: 3,
          liveBufferLatencyMinRemain: 0.3,
          autoCleanupSourceBuffer: true,
          lazyLoad: false,
        },
      ) as unknown as MpegtsPlayer;
      mpegtsRef.current = player;
      player.attachMediaElement(v);
      player.on("error", (...args: unknown[]) => {
        console.error("[player] mpegts error", ...args);
        setErrorMsg(`تعذر تشغيل MPEG-TS. ${String(args[0] ?? "")}`);
      });
      try {
        player.load();
        if (autoplay) void player.play();
      } catch (e) {
        console.error("[player] mpegts load", e);
        queueMicrotask(() => setErrorMsg("تعذر بدء تحميل MPEG-TS."));
      }
    } else {
      attachNative();
    }

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          /* ignore */
        }
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        try {
          mpegtsRef.current.unload();
          mpegtsRef.current.detachMediaElement();
          mpegtsRef.current.destroy();
        } catch {
          /* ignore */
        }
        mpegtsRef.current = null;
      }
    };
  }, [src, autoplay, live]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onWait = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onErr = () => {
      const err = v.error;
      const code = err?.code ?? "?";
      const msg = err?.message || "";
      console.error("[player] video error", code, msg, v.currentSrc);
      setErrorMsg(`خطأ في التشغيل (رمز ${code}). ${msg}`);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onErr);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m" || e.key === "M") {
        setMuted((x) => !x);
      } else if (e.key === "f" || e.key === "F") {
        void toggleFullscreen();
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    type PipDocument = Document & { pictureInPictureElement: Element | null };
    type PipVideo = HTMLVideoElement & { requestPictureInPicture?: () => Promise<PictureInPictureWindow> };
    try {
      const doc = document as PipDocument;
      if (doc.pictureInPictureElement) await document.exitPictureInPicture();
      else await (v as PipVideo).requestPictureInPicture?.();
    } catch {
      // ignore
    }
  };

  const poke = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const seek = (pct: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (pct / 100) * duration;
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={poke}
      onClick={poke}
      className="relative h-full w-full bg-black"
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="h-full w-full object-contain bg-black"
      />
      <div
        className={cn(
          "absolute inset-0 player-overlay transition-opacity pointer-events-none",
          showControls ? "opacity-100" : "opacity-0",
        )}
      />
      {buffering && !errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      {errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6">
          <div className="glass-strong rounded-2xl p-6 max-w-md text-center">
            <div className="text-lg font-bold text-white mb-1">تعذر التشغيل</div>
            <div className="text-white/70 text-sm mb-4">{errorMsg}</div>
            <button
              className="btn-primary"
              onClick={() => {
                setErrorMsg(null);
                const v = videoRef.current;
                if (v) {
                  v.load();
                  void v.play();
                }
              }}
            >
              <RotateCw className="h-4 w-4" /> إعادة المحاولة
            </button>
          </div>
        </div>
      )}
      <div
        className={cn(
          "absolute inset-x-0 top-0 p-4 flex items-center gap-2 text-white transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {onClose && (
          <button
            className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            onClick={onClose}
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {title && (
          <div className="font-semibold truncate drop-shadow">{title}</div>
        )}
        {live && (
          <span className="chip !bg-accent-600/80 !text-white border-0">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-4 flex flex-col gap-2 text-white transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {!live && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] tabular-nums w-12 text-right">
              {formatDuration(current)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={duration ? (current / duration) * 100 : 0}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 accent-accent-500"
            />
            <span className="text-[11px] tabular-nums w-12">
              {formatDuration(duration)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center"
            onClick={togglePlay}
            title={playing ? "إيقاف" : "تشغيل"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            onClick={() => setMuted((x) => !x)}
            title="كتم"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setMuted(false);
              setVolume(Number(e.target.value));
            }}
            className="w-24 accent-accent-500"
          />
          <div className="flex-1" />
          <button
            className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            onClick={togglePip}
            title="Picture in Picture"
          >
            <PictureInPicture2 className="h-4 w-4" />
          </button>
          <button
            className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            onClick={toggleFullscreen}
            title="ملء الشاشة"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
