import { Heart, Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { Channel } from "../lib/types";
import { cn } from "../lib/utils";

interface Props {
  ch: Channel;
  onOpen: (ch: Channel) => void;
  variant?: "poster" | "tile";
}

export function ChannelCard({ ch, onOpen, variant = "poster" }: Props) {
  const toggle = useAppStore((s) => s.toggleFavorite);
  const fav = useAppStore((s) => s.isFavorite(ch));
  const isPoster = variant === "poster" && (ch.kind === "movie" || ch.kind === "series");
  const image = ch.poster || ch.logo;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={() => onOpen(ch)}
      className={cn(
        "group relative overflow-hidden text-right",
        isPoster
          ? "card aspect-[2/3] w-full"
          : "card flex items-center gap-3 p-3 w-full h-[84px]",
      )}
    >
      {isPoster ? (
        <>
          <div className="absolute inset-0 bg-ink-600">
            {image ? (
              <img
                src={image}
                alt={ch.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-ink-500 to-ink-800" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-center gap-1 text-[11px] text-white/80">
              {ch.year && <span className="chip !py-0.5 !px-2">{ch.year}</span>}
              {typeof ch.rating === "number" && ch.rating > 0 && (
                <span className="chip !py-0.5 !px-2">
                  <Star className="h-3 w-3 text-cine-gold" /> {ch.rating.toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-white drop-shadow">
              {ch.name}
            </div>
          </div>
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
            <span className="btn-primary !py-1 !px-2 text-xs">
              <Play className="h-3 w-3" /> تشغيل
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void toggle(ch);
            }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60"
            title="مفضلة"
          >
            <Heart
              className={cn("h-4 w-4", fav && "fill-accent-500 text-accent-500")}
            />
          </button>
        </>
      ) : (
        <>
          <div className="h-[60px] w-[60px] shrink-0 rounded-lg bg-ink-600 border border-white/5 flex items-center justify-center overflow-hidden">
            {image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain p-1.5"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Play className="h-5 w-5 text-white/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{ch.name}</div>
            {ch.group && (
              <div className="truncate text-[11px] text-white/50 mt-0.5">{ch.group}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void toggle(ch);
            }}
            className="h-8 w-8 shrink-0 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            title="مفضلة"
          >
            <Heart
              className={cn("h-4 w-4", fav ? "fill-accent-500 text-accent-500" : "text-white/70")}
            />
          </button>
        </>
      )}
    </motion.button>
  );
}
