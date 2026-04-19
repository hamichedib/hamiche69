import { useAppStore } from "../stores/appStore";
import type { Settings } from "../lib/types";

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    void update({ [k]: v } as Partial<Settings>);

  return (
    <div className="space-y-4 pb-10 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">الإعدادات</h1>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">الواجهة</h2>
        <Row
          label="الشريط الجانبي المضغوط"
          description="عرض رموز فقط في الشريط الجانبي لمساحة أكبر."
        >
          <Toggle checked={settings.compactSidebar} onChange={(v) => set("compactSidebar", v)} />
        </Row>
        <Row label="اللغة" description="اللغة الافتراضية للواجهة.">
          <select
            className="input max-w-[160px]"
            value={settings.locale}
            onChange={(e) => set("locale", e.target.value as Settings["locale"])}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Row>
        <Row label="اللون المميز" description="لون التمييز في الواجهة.">
          <select
            className="input max-w-[160px]"
            value={settings.accent}
            onChange={(e) => set("accent", e.target.value as Settings["accent"])}
          >
            <option value="rose">وردي</option>
            <option value="purple">بنفسجي</option>
            <option value="cyan">سماوي</option>
            <option value="gold">ذهبي</option>
          </select>
        </Row>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">التشغيل</h2>
        <Row label="تشغيل تلقائي">
          <Toggle checked={settings.autoplay} onChange={(v) => set("autoplay", v)} />
        </Row>
        <Row label="تسريع الأجهزة">
          <Toggle checked={settings.hwAccel} onChange={(v) => set("hwAccel", v)} />
        </Row>
        <Row label="حجم الحافظة (ثواني)">
          <input
            type="number"
            min={10}
            max={120}
            className="input max-w-[120px]"
            value={settings.bufferSeconds}
            onChange={(e) => set("bufferSeconds", Number(e.target.value))}
          />
        </Row>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">الرقابة الأبوية</h2>
        <Row label="تفعيل الرقابة">
          <Toggle
            checked={settings.parentalEnabled}
            onChange={(v) => set("parentalEnabled", v)}
          />
        </Row>
        {settings.parentalEnabled && (
          <Row label="رقم PIN">
            <input
              type="password"
              maxLength={6}
              className="input max-w-[120px]"
              value={settings.parentalPin ?? ""}
              onChange={(e) => set("parentalPin", e.target.value)}
              placeholder="0000"
            />
          </Row>
        )}
      </div>

      <div className="text-xs text-white/40 pt-4">
        Cinema IPTV 2026 • مبني بواسطة Tauri + React. يعمل على Windows 11.
      </div>
    </div>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-b-0">
      <div className="min-w-0">
        <div className="font-medium text-white">{label}</div>
        {description && <div className="text-xs text-white/50 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full transition " +
        (checked ? "bg-accent-500" : "bg-white/15")
      }
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition " +
          (checked ? "translate-x-[-22px]" : "translate-x-[-2px]")
        }
      />
    </button>
  );
}
