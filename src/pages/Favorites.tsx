import { useNavigate } from "react-router-dom";
import { Empty } from "../components/Empty";
import { Grid } from "../components/Grid";
import { ChannelCard } from "../components/ChannelCard";
import { useAppStore } from "../stores/appStore";
import type { Channel } from "../lib/types";

export function FavoritesPage() {
  const nav = useNavigate();
  const favorites = useAppStore((s) => s.favorites);
  const channels = useAppStore((s) => s.channels);
  const setNow = useAppStore((s) => s.setNowPlaying);
  const fetchSeasons = useAppStore((s) => s.fetchSeasons);

  const items = favorites
    .map((f) => channels.find((c) => c.id === f.channelId))
    .filter((c): c is Channel => Boolean(c));

  const onOpen = (ch: Channel) => {
    if (ch.kind === "series") {
      void fetchSeasons(ch);
      nav(`/series/${ch.id}`);
      return;
    }
    setNow(ch);
  };

  if (items.length === 0) {
    return (
      <Empty
        title="لا توجد مفضلات"
        description="اضغط على أيقونة القلب لإضافة القنوات والأفلام إلى مفضلتك."
        ctaLabel="استعرض البث المباشر"
        ctaHref="/live"
      />
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-extrabold text-white">المفضلة</h1>
      <Grid>
        {items.map((c) => (
          <ChannelCard key={c.id} ch={c} onOpen={onOpen} />
        ))}
      </Grid>
    </div>
  );
}
