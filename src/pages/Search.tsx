import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { ChannelCard } from "../components/ChannelCard";
import { cn } from "../lib/utils";
import type { Channel, StreamKind } from "../lib/types";

const KINDS: { value: StreamKind | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "live", label: "مباشر" },
  { value: "movie", label: "أفلام" },
  { value: "series", label: "مسلسلات" },
];

export function SearchPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<StreamKind | "all">("all");
  const q = params.get("q") ?? "";
  const channels = useAppStore((s) => s.channels);
  const setNow = useAppStore((s) => s.setNowPlaying);
  const fetchSeasons = useAppStore((s) => s.fetchSeasons);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    let list = channels.filter((c) => c.name.toLowerCase().includes(needle));
    if (kind !== "all") list = list.filter((c) => c.kind === kind);
    return list.slice(0, 240);
  }, [channels, q, kind]);

  const onOpen = (ch: Channel) => {
    if (ch.kind === "series") {
      void fetchSeasons(ch);
      nav(`/series/${ch.id}`);
      return;
    }
    setNow(ch);
  };

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-white">بحث</h1>
        <div className="text-sm text-white/50 mt-0.5">
          {q ? `نتائج البحث عن "${q}"` : "ابحث عن قناة، فيلم، أو مسلسل"}
        </div>
      </div>
      <input
        autoFocus
        defaultValue={q}
        onChange={(e) => {
          const v = e.target.value;
          if (v) setParams({ q: v });
          else setParams({});
        }}
        className="input"
        placeholder="ابحث..."
      />
      <div className="flex gap-2 flex-wrap">
        {KINDS.map((k) => (
          <button
            key={k.value}
            className={cn("chip", kind === k.value && "chip-active")}
            onClick={() => setKind(k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>
      {q && results.length === 0 && (
        <div className="text-center py-16 text-white/50">لا توجد نتائج.</div>
      )}
      {results.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((c) => (
            <ChannelCard key={c.id} ch={c} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
