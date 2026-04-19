# Cinema IPTV 2026

مشغل IPTV عصري وسريع لـ **Windows 11**، مبني بـ **Tauri 2 + React + TypeScript**،
بتصميم سينمائي داكن مع Glassmorphism وتأثيرات Aurora.

> Elegant, fast, and modern IPTV player for Windows 11 — built with Tauri 2 + React + TypeScript.

## ✨ الميزات

- 🎬 **Live TV + Movies (VOD) + Series** مع بوسترات وتصنيفات.
- 🔌 دعم **M3U / M3U8** (رابط أو ملف محلي) و **Xtream Codes API**.
- 📺 **HLS** سلس عبر hls.js مع زر PiP وملء الشاشة وضبط الصوت.
- 📅 **EPG (XMLTV)** لدليل البرامج.
- ❤️ **مفضلة**، **مشاهدات حديثة**، **بحث**، **تصنيفات**.
- 🔐 **رقابة أبوية** بـ PIN (اختياري).
- 🎨 **Cinema 2026** aesthetic — خلفيات متحركة، تدرجات، RTL عربي.
- 🪶 تخزين محلي آمن (Tauri Store) يبقى بين الجلسات.

## 🏗️ التقنية

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend:** Tauri 2 (Rust) — exe و msi صغيران ومحسنان
- **Playback:** HLS.js + HTML5 `<video>`
- **State:** Zustand
- **Icons:** Lucide

## 🚀 التشغيل محلياً

```bash
npm install
# وضع التطوير (متصفح)
npm run dev
# أو التطبيق المكتبي
npx tauri dev
```

### متطلبات سطح المكتب
- Node.js ≥ 20
- Rust stable + MSVC toolchain (ويندوز) / build-essential (لينكس)
- WebView2 (مدمج في Windows 11)

## 🏭 البناء

```bash
# بناء الويب
npm run build
# بناء التطبيق (يستنتج المنصة تلقائياً)
npx tauri build
```

### ✅ ملف `.exe` لويندوز 11
يتم بناء المثبت تلقائياً عبر **GitHub Actions** (`.github/workflows/build.yml`)
وينتج ملفات:
- `*.exe` (NSIS installer)
- `*.msi` (MSI installer)

حمّل أحدث نسخة من صفحة **Actions → Artifacts** أو من **Releases**
عند دفع وسم `vX.Y.Z`.

## 🗂️ هيكل المشروع

```
src/
  components/   # Sidebar, TopBar, VideoPlayer, ChannelCard, ...
  pages/        # Home, Live, Movies, Series, Favorites, Search, Playlists, Settings
  lib/          # m3u, xtream, epg, http, storage, utils, types
  stores/       # Zustand app store
src-tauri/      # Tauri 2 Rust backend
```

## ⚠️ ملاحظات

- الحقوق وعناوين القوائم/القنوات مسؤولية المستخدم. هذا المشغل لا يتضمن محتوى.
- الأفضل تشغيل روابط HLS (`.m3u8`) مباشرة. `.mp4/.mkv` تعمل أيضاً عبر HTML5.
- Xtream Codes API يدعم: الفئات، القنوات المباشرة، الأفلام (VOD)، المسلسلات بمواسمها.

## 📜 الرخصة
MIT
