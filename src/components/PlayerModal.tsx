import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "./VideoPlayer";
import { useAppStore } from "../stores/appStore";

export function PlayerModal() {
  const ch = useAppStore((s) => s.nowPlaying);
  const urlOverride = useAppStore((s) => s.nowPlayingUrlOverride);
  const setNow = useAppStore((s) => s.setNowPlaying);

  const src = urlOverride ?? ch?.url ?? "";
  const title = ch?.name;
  const open = Boolean(ch && src);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center"
          onClick={() => setNow(null)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(1200px,92vw)] h-[min(720px,82vh)] rounded-2xl overflow-hidden border border-white/10 shadow-glow"
          >
            <VideoPlayer
              src={src}
              title={title}
              poster={ch?.poster || ch?.logo}
              onClose={() => setNow(null)}
              live={ch?.kind === "live"}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
