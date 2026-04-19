import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Heart, Play, Star } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { cn } from "../lib/utils";

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const ch = useAppStore((s) => s.channels.find((c) => c.id === id));
  const fetchSeasons = useAppStore((s) => s.fetchSeasons);
  const setNow = useAppStore((s) => s.setNowPlaying);
  const toggleFav = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => (ch ? s.isFavorite(ch) : false));
  const [seasonIdx, setSeasonIdx] = useState(0);

  useEffect(() => {
    if (ch && ch.kind === "series" && !ch.seasons) void fetchSeasons(ch);
  }, [ch, fetchSeasons]);

  if (!ch) {
    return (
      <div className="p-10 text-center">
        <div className="text-white/60">لم يتم العثور على المسلسل.</div>
        <button className="btn-ghost mt-4" onClick={() => nav("/series")}>
          <ArrowRight className="h-4 w-4" /> العودة
        </button>
      </div>
    );
  }

  const season = ch.seasons?.[seasonIdx];

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden card">
        <div className="absolute inset-0">
          {ch.poster && (
            <img
              src={ch.poster}
              alt=""
              className="h-full w-full object-cover opacity-30 blur-xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/80 to-ink-900/40" />
        </div>
        <div className="relative p-6 sm:p-10 flex flex-col md:flex-row gap-6">
          <div className="w-[220px] aspect-[2/3] rounded-2xl overflow-hidden shadow-glow shrink-0 mx-auto md:mx-0 bg-ink-600">
            {ch.poster && (
              <img src={ch.poster} alt={ch.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <button
              className="btn-ghost mb-3"
              onClick={() => nav(-1)}
              aria-label="العودة"
            >
              <ArrowRight className="h-4 w-4" /> العودة
            </button>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{ch.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
              {ch.year && <span className="chip">{ch.year}</span>}
              {ch.genre && <span className="chip">{ch.genre}</span>}
              {typeof ch.rating === "number" && ch.rating > 0 && (
                <span className="chip">
                  <Star className="h-3 w-3 text-cine-gold" /> {ch.rating.toFixed(1)}
                </span>
              )}
            </div>
            {ch.plot && <p className="mt-4 text-white/70 leading-relaxed">{ch.plot}</p>}
            <div className="mt-5 flex gap-2">
              {season?.episodes?.[0] && (
                <button
                  className="btn-primary"
                  onClick={() =>
                    setNow(
                      { ...ch, name: `${ch.name} — ${season.episodes[0].title}` },
                      season.episodes[0].url,
                    )
                  }
                >
                  <Play className="h-4 w-4" /> تشغيل الحلقة 1
                </button>
              )}
              <button className="btn-ghost" onClick={() => void toggleFav(ch)}>
                <Heart className={cn("h-4 w-4", isFav && "fill-accent-500 text-accent-500")} />
                {isFav ? "في المفضلة" : "أضف للمفضلة"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!ch.seasons ? (
        <div className="text-center py-10 text-white/50">جاري تحميل المواسم...</div>
      ) : ch.seasons.length === 0 ? (
        <div className="text-center py-10 text-white/50">لا توجد حلقات متاحة.</div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {ch.seasons.map((s, i) => (
              <button
                key={s.id}
                className={cn("chip", i === seasonIdx && "chip-active")}
                onClick={() => setSeasonIdx(i)}
              >
                {s.name}
                <span className="text-white/50">{s.episodes.length}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {season?.episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() =>
                  setNow({ ...ch, name: `${ch.name} — ${ep.title}` }, ep.url)
                }
                className="card p-3 flex gap-3 items-center hover:bg-white/5 transition text-right"
              >
                <div className="h-16 w-24 rounded-lg bg-ink-600 overflow-hidden shrink-0">
                  {ep.poster ? (
                    <img src={ep.poster} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/40">
                      <Play className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white/50">
                    الحلقة {ep.episode}
                  </div>
                  <div className="truncate text-sm font-semibold text-white">
                    {ep.title}
                  </div>
                  {ep.duration && (
                    <div className="text-[11px] text-white/50 mt-0.5">{ep.duration}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
