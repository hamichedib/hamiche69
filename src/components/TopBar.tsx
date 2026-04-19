import { useNavigate } from "react-router-dom";
import { Download, PanelLeft, RefreshCw, Search, PlusCircle } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { useState } from "react";

export function TopBar() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const compact = useAppStore((s) => s.settings.compactSidebar);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const active = useAppStore((s) =>
    s.playlists.find((p) => p.id === s.activePlaylistId),
  );
  const sync = useAppStore((s) => s.syncActivePlaylist);
  const loading = useAppStore((s) => s.loadingChannels);

  return (
    <header className="drag glass sticky top-0 z-20 flex items-center gap-3 px-4 h-14 border-b border-white/5">
      <button
        className="no-drag btn-ghost !px-2 !py-2"
        onClick={() => updateSettings({ compactSidebar: !compact })}
        title="Toggle sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </button>
      <form
        className="no-drag relative flex-1 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input pr-10"
          placeholder="ابحث عن قناة، فيلم أو مسلسل..."
        />
      </form>
      <div className="no-drag flex items-center gap-2">
        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="text-[11px] text-white/40">القائمة النشطة</span>
          <span className="text-sm font-semibold text-white">
            {active?.name ?? "— لا توجد —"}
          </span>
        </div>
        <button
          className="btn-ghost"
          onClick={() => sync()}
          disabled={!active || loading}
          title="تحديث القائمة"
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {loading ? "تحديث..." : "تحديث"}
        </button>
        <button className="btn-primary" onClick={() => nav("/playlists?new=1")}>
          <PlusCircle className="h-4 w-4" />
          قائمة جديدة
        </button>
        <a
          className="btn-ghost"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          title="تنزيل نسخة ويندوز"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
