import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Loader2, X, AlertTriangle, RotateCw } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { playStream, type PlaySession } from "../lib/player";

export function PlayerModal() {
  const ch = useAppStore((s) => s.nowPlaying);
  const urlOverride = useAppStore((s) => s.nowPlayingUrlOverride);
  const setNow = useAppStore((s) => s.setNowPlaying);

  const src = urlOverride ?? ch?.url ?? "";
  const title = ch?.name;
  const open = Boolean(ch && src);

  const [status, setStatus] = useState<"idle" | "launching" | "playing" | "closed" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sessionRef = useRef<PlaySession | null>(null);

  useEffect(() => {
    if (!open || !src) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("launching");
    setErrorMsg(null);
    (async () => {
      try {
        const session = await playStream(src, {
          title: title ?? "Cinema IPTV 2026",
          live: ch?.kind === "live",
        });
        if (cancelled) {
          await session.stop();
          return;
        }
        sessionRef.current = session;
        setStatus("playing");
        const code = await session.wait;
        if (!cancelled) {
          sessionRef.current = null;
          if (code === 0 || code === null) {
            setStatus("closed");
            setNow(null);
          } else {
            setStatus("error");
            setErrorMsg(`خرج مشغل mpv برمز ${code}. راجع الرابط أو الاتصال بالإنترنت.`);
          }
        }
      } catch (e) {
        console.error("[PlayerModal] spawn failed", e);
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            `تعذر تشغيل المشغل الخارجي mpv: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      const s = sessionRef.current;
      sessionRef.current = null;
      if (s) void s.stop();
    };
  }, [open, src, title, ch?.kind, setNow]);

  const close = async () => {
    const s = sessionRef.current;
    sessionRef.current = null;
    if (s) await s.stop();
    setNow(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(560px,92vw)] rounded-2xl overflow-hidden border border-white/10 shadow-glow bg-ink-900"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="font-semibold text-white truncate">{title ?? "تشغيل"}</div>
              <button
                className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                onClick={close}
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 min-h-[180px] flex flex-col items-center justify-center text-center">
              {status === "launching" && (
                <>
                  <Loader2 className="h-10 w-10 text-accent-500 animate-spin mb-3" />
                  <div className="text-white font-semibold">جاري تشغيل mpv...</div>
                  <div className="text-white/60 text-sm mt-1">
                    ستُفتح نافذة المشغل المنفصلة خلال لحظات.
                  </div>
                </>
              )}
              {status === "playing" && (
                <>
                  <div className="h-10 w-10 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center mb-3">
                    <span className="h-3 w-3 rounded-full bg-accent-500 animate-pulse" />
                  </div>
                  <div className="text-white font-semibold">يشتغل في نافذة mpv</div>
                  <div className="text-white/60 text-sm mt-1">
                    اضغط Esc أو أغلق نافذة mpv للعودة إلى المكتبة.
                  </div>
                  <div className="text-white/50 text-[11px] mt-3 break-all px-4">
                    {src}
                  </div>
                </>
              )}
              {status === "error" && (
                <>
                  <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
                  <div className="text-white font-semibold mb-1">تعذر التشغيل</div>
                  <div className="text-white/70 text-sm mb-4 max-w-md">{errorMsg}</div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setStatus("idle");
                      setErrorMsg(null);
                      setNow(ch);
                    }}
                  >
                    <RotateCw className="h-4 w-4" /> إعادة المحاولة
                  </button>
                </>
              )}
              {status === "closed" && (
                <div className="text-white/70 text-sm">انتهى التشغيل.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
