import { motion } from "framer-motion";
import { Clapperboard, Film, Heart, Play, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { ChannelCard } from "../components/ChannelCard";
import { Grid } from "../components/Grid";
import { Empty } from "../components/Empty";
import type { Channel } from "../lib/types";

export function HomePage() {
  const nav = useNavigate();
  const channels = useAppStore((s) => s.channels);
  const activeId = useAppStore((s) => s.activePlaylistId);
  const recents = useAppStore((s) => s.recents);
  const setNow = useAppStore((s) => s.setNowPlaying);
  const fetchSeasons = useAppStore((s) => s.fetchSeasons);
  const loading = useAppStore((s) => s.loadingChannels);

  if (!activeId) {
    return <Empty />;
  }

  const live = channels.filter((c) => c.kind === "live");
  const movies = channels.filter((c) => c.kind === "movie");
  const series = channels.filter((c) => c.kind === "series");
  const recentChannels = recents
    .map((r) => channels.find((c) => c.id === r.channelId))
    .filter((c): c is Channel => Boolean(c));

  const onOpen = (ch: Channel) => {
    if (ch.kind === "series") {
      void fetchSeasons(ch);
      nav(`/series/${ch.id}`);
      return;
    }
    setNow(ch);
  };

  const stats = [
    { label: "قنوات مباشرة", value: live.length, icon: Tv, color: "from-cine-cyan to-blue-500" },
    { label: "أفلام", value: movies.length, icon: Film, color: "from-accent-500 to-cine-pink" },
    { label: "مسلسلات", value: series.length, icon: Clapperboard, color: "from-cine-purple to-indigo-500" },
    { label: "مفضلة", value: useAppStore.getState().favorites.length, icon: Heart, color: "from-cine-gold to-orange-500" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden card p-8 sm:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 via-cine-purple/15 to-cine-cyan/15 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
              Cinema IPTV 2026
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mt-2 text-white leading-tight">
              أهلاً بك في <span className="text-gradient">سينما 2026</span>
            </h1>
            <p className="mt-3 text-white/70 max-w-xl">
              مشغل IPTV أنيق وسريع لويندوز 11. بث مباشر وأفلام ومسلسلات ودليل برامج EPG،
              بواجهة سينمائية عصرية.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => nav("/live")}>
                <Play className="h-4 w-4" /> ابدأ البث المباشر
              </button>
              <button className="btn-ghost" onClick={() => nav("/movies")}>
                <Film className="h-4 w-4" /> استعراض الأفلام
              </button>
              <button className="btn-ghost" onClick={() => nav("/series")}>
                <Clapperboard className="h-4 w-4" /> المسلسلات
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 min-w-[140px]">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-extrabold text-white tabular-nums">
                  {s.value.toLocaleString()}
                </div>
                <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {loading && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      )}

      {recentChannels.length > 0 && (
        <Section title="استكمال المشاهدة" onMore={() => nav("/favorites")}>
          <Grid>
            {recentChannels.slice(0, 12).map((c) => (
              <ChannelCard key={c.id} ch={c} onOpen={onOpen} />
            ))}
          </Grid>
        </Section>
      )}

      {movies.length > 0 && (
        <Section title="أفلام مميزة" onMore={() => nav("/movies")}>
          <Grid>
            {movies.slice(0, 12).map((c) => (
              <ChannelCard key={c.id} ch={c} onOpen={onOpen} />
            ))}
          </Grid>
        </Section>
      )}

      {series.length > 0 && (
        <Section title="مسلسلات" onMore={() => nav("/series")}>
          <Grid>
            {series.slice(0, 12).map((c) => (
              <ChannelCard key={c.id} ch={c} onOpen={onOpen} />
            ))}
          </Grid>
        </Section>
      )}

      {live.length > 0 && (
        <Section title="قنوات شائعة" onMore={() => nav("/live")}>
          <Grid variant="tile">
            {live.slice(0, 12).map((c) => (
              <ChannelCard key={c.id} ch={c} onOpen={onOpen} variant="tile" />
            ))}
          </Grid>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  onMore,
  children,
}: {
  title: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {onMore && (
          <button onClick={onMore} className="text-sm text-white/70 hover:text-white">
            عرض الكل
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
