import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Check, Cloud, FileCode2, Plus, Trash2, X } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { fetchText } from "../lib/http";
import { xtreamAuth } from "../lib/xtream";
import { uid, cn, isTauri } from "../lib/utils";
import type { Playlist } from "../lib/types";

type Mode = "m3u-url" | "m3u-file" | "xtream";

export function PlaylistsPage() {
  const playlists = useAppStore((s) => s.playlists);
  const active = useAppStore((s) => s.activePlaylistId);
  const setActive = useAppStore((s) => s.setActivePlaylist);
  const remove = useAppStore((s) => s.removePlaylist);
  const add = useAppStore((s) => s.addPlaylist);
  const loadError = useAppStore((s) => s.loadError);
  const [params, setParams] = useSearchParams();
  const shouldOpen = params.get("new") === "1";
  const [open, setOpen] = useState(false);
  const hasPlaylists = playlists.length > 0;

  useEffect(() => {
    if (shouldOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }, [shouldOpen, params, setParams]);

  const onAddPlaylist = async (p: Playlist) => {
    await add(p);
    setOpen(false);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">القوائم</h1>
          <div className="text-sm text-white/50">
            أضف قائمة M3U أو حساب Xtream Codes. يمكنك إضافة عدة قوائم والتبديل بينها.
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" /> إضافة قائمة
        </button>
      </div>

      {loadError && (
        <div className="card p-4 border-accent-500/40 bg-accent-500/10 text-accent-100">
          خطأ في تحميل القائمة: {loadError}
        </div>
      )}

      {!hasPlaylists && (
        <div className="card p-5">
          <div className="text-white/70 text-sm mb-3">
            لم تقم بإضافة أي قائمة بعد. أضف قائمتك الأولى من هنا مباشرة:
          </div>
          <PlaylistForm onAdd={onAddPlaylist} />
        </div>
      )}

      {hasPlaylists && (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p) => (
            <div key={p.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {p.kind === "m3u" ? (
                      <FileCode2 className="h-4 w-4 text-cine-cyan" />
                    ) : (
                      <Cloud className="h-4 w-4 text-cine-purple" />
                    )}
                    <div className="truncate font-semibold text-white">{p.name}</div>
                  </div>
                  <div className="text-xs text-white/50 mt-1 truncate">
                    {p.kind === "m3u" ? (p.url ?? "ملف محلي") : p.host}
                  </div>
                  {p.lastSyncAt && (
                    <div className="text-[11px] text-white/40 mt-1">
                      آخر مزامنة: {new Date(p.lastSyncAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-accent-500/20 flex items-center justify-center text-white/60 hover:text-accent-400"
                  onClick={() => void remove(p.id)}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                className={cn(
                  "btn w-full",
                  active === p.id
                    ? "bg-accent-500/20 border border-accent-400/40 text-white"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10",
                )}
                onClick={() => void setActive(p.id)}
              >
                {active === p.id ? (
                  <>
                    <Check className="h-4 w-4" /> نشطة
                  </>
                ) : (
                  "اجعلها النشطة"
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <AddPlaylistModal onClose={() => setOpen(false)} onAdd={onAddPlaylist} />
      )}
    </div>
  );
}

function AddPlaylistModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: Playlist) => Promise<void>;
}) {
  const node = (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-5 space-y-4 bg-ink-900 border border-white/15 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-white">إضافة قائمة</h3>
            <div className="text-xs text-white/60 mt-0.5">
              دعم M3U/M3U8 و Xtream Codes. يمكنك استخدام أكثر من قائمة.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <PlaylistForm
          onAdd={async (p) => {
            await onAdd(p);
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}

function PlaylistForm({
  onAdd,
  onCancel,
}: {
  onAdd: (p: Playlist) => Promise<void>;
  onCancel?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("m3u-url");
  const [name, setName] = useState("قائمتي");
  const [m3uUrl, setM3uUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [host, setHost] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (mode === "m3u-url") {
        const url = m3uUrl.trim();
        if (!url) throw new Error("الرابط مطلوب");
        try {
          const text = await fetchText(url, 15_000);
          if (text && !/#EXTM3U/i.test(text) && !/#EXTINF/i.test(text)) {
            console.warn("[playlist] URL does not look like M3U, saving anyway");
          }
        } catch (probe) {
          console.warn("[playlist] preflight fetch failed, saving anyway:", probe);
        }
        await onAdd({
          id: uid(),
          kind: "m3u",
          name: name.trim() || "قائمة M3U",
          url,
          epgUrl: epgUrl.trim() || undefined,
          createdAt: Date.now(),
        });
      } else if (mode === "m3u-file") {
        if (!rawText.trim()) throw new Error("ألصق محتوى ملف M3U أو اختر ملفاً");
        await onAdd({
          id: uid(),
          kind: "m3u",
          name: name.trim() || "قائمة محلية",
          raw: rawText,
          epgUrl: epgUrl.trim() || undefined,
          createdAt: Date.now(),
        });
      } else {
        if (!host.trim() || !user.trim() || !pass.trim())
          throw new Error("كل حقول Xtream مطلوبة");
        let normalizedHost = host.trim().replace(/\/$/, "");
        if (!/^https?:\/\//i.test(normalizedHost)) {
          normalizedHost = `http://${normalizedHost}`;
        }
        const pl: Playlist = {
          id: uid(),
          kind: "xtream",
          name: name.trim() || normalizedHost,
          host: normalizedHost,
          username: user.trim(),
          password: pass.trim(),
          epgUrl: epgUrl.trim() || undefined,
          createdAt: Date.now(),
        };
        try {
          const ok = await xtreamAuth(pl, (u) => fetchText(u, 15_000));
          if (!ok) console.warn("[playlist] xtream auth returned non-success");
        } catch (probe) {
          console.warn("[playlist] xtream auth probe failed, saving anyway:", probe);
        }
        await onAdd(pl);
      }
    } catch (e) {
      console.error("[playlist] add failed", e);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function openFile() {
    if (!isTauri()) {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".m3u,.m3u8,text/plain";
      inp.onchange = async () => {
        const f = inp.files?.[0];
        if (!f) return;
        setRawText(await f.text());
        if (!name.trim() || name === "قائمتي") setName(f.name.replace(/\.[^.]+$/, ""));
      };
      inp.click();
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const picked = await open({
        multiple: false,
        filters: [{ name: "Playlist", extensions: ["m3u", "m3u8", "txt"] }],
      });
      if (typeof picked === "string") {
        const text = await readTextFile(picked);
        setRawText(text);
        if (!name.trim() || name === "قائمتي")
          setName(picked.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "قائمة");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className={cn("chip cursor-pointer", mode === "m3u-url" && "chip-active")}
          onClick={() => setMode("m3u-url")}
        >
          رابط M3U
        </button>
        <button
          type="button"
          className={cn("chip cursor-pointer", mode === "m3u-file" && "chip-active")}
          onClick={() => setMode("m3u-file")}
        >
          ملف محلي
        </button>
        <button
          type="button"
          className={cn("chip cursor-pointer", mode === "xtream" && "chip-active")}
          onClick={() => setMode("xtream")}
        >
          Xtream Codes
        </button>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-white/60">اسم القائمة</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {mode === "m3u-url" && (
        <div className="space-y-1">
          <label className="text-xs text-white/60">رابط M3U</label>
          <input
            className="input"
            value={m3uUrl}
            onChange={(e) => setM3uUrl(e.target.value)}
            placeholder="https://example.com/list.m3u"
            dir="ltr"
          />
        </div>
      )}
      {mode === "m3u-file" && (
        <div className="space-y-1">
          <label className="text-xs text-white/60">محتوى الملف</label>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={openFile}>
              اختر ملفاً
            </button>
          </div>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="#EXTM3U..."
            dir="ltr"
          />
        </div>
      )}
      {mode === "xtream" && (
        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-white/60">الخادم (Host)</label>
            <input
              className="input"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://server.com:8080"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-white/60">اسم المستخدم</label>
              <input
                className="input"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">كلمة المرور</label>
              <input
                type="password"
                className="input"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs text-white/60">رابط EPG (اختياري XMLTV)</label>
        <input
          className="input"
          value={epgUrl}
          onChange={(e) => setEpgUrl(e.target.value)}
          placeholder="https://example.com/epg.xml"
          dir="ltr"
        />
      </div>
      {err && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          {err}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "جاري الإضافة..." : "إضافة"}
        </button>
      </div>
    </div>
  );
}
