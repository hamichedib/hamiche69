import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChannelCard } from "../components/ChannelCard";
import { CategoryTabs } from "../components/CategoryTabs";
import { Empty } from "../components/Empty";
import { Grid } from "../components/Grid";
import { useAppStore } from "../stores/appStore";
import type { Channel, StreamKind } from "../lib/types";

interface Props {
  kind: StreamKind;
  title: string;
  variant?: "poster" | "tile";
}

export function ChannelsPage({ kind, title, variant = "poster" }: Props) {
  const nav = useNavigate();
  const channels = useAppStore((s) => s.channels.filter((c) => c.kind === kind));
  const activeId = useAppStore((s) => s.activePlaylistId);
  const setNow = useAppStore((s) => s.setNowPlaying);
  const fetchSeasons = useAppStore((s) => s.fetchSeasons);
  const loading = useAppStore((s) => s.loadingChannels);
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of channels) {
      const g = c.group || "غير مصنف";
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [channels]);

  const filtered = useMemo(() => {
    let list = channels;
    if (cat) list = list.filter((c) => (c.group || "غير مصنف") === cat);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(needle));
    }
    return list;
  }, [channels, cat, q]);

  const onOpen = (ch: Channel) => {
    if (ch.kind === "series") {
      void fetchSeasons(ch);
      nav(`/series/${ch.id}`);
      return;
    }
    setNow(ch);
  };

  if (!activeId) return <Empty />;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          <div className="text-sm text-white/50">{channels.length.toLocaleString()} عنصر</div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث..."
          className="input max-w-sm"
        />
      </div>

      <CategoryTabs
        categories={groups.map(([g]) => g)}
        counts={Object.fromEntries(groups)}
        value={cat}
        onChange={setCat}
      />

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/50">لا توجد نتائج.</div>
      ) : (
        <Grid variant={variant}>
          {filtered.map((c) => (
            <ChannelCard key={c.id} ch={c} onOpen={onOpen} variant={variant} />
          ))}
        </Grid>
      )}
    </div>
  );
}
