import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { BackgroundFX } from "./components/BackgroundFX";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { PlayerModal } from "./components/PlayerModal";
import { HomePage } from "./pages/Home";
import { ChannelsPage } from "./pages/ChannelsPage";
import { SeriesDetailPage } from "./pages/SeriesDetail";
import { FavoritesPage } from "./pages/Favorites";
import { SearchPage } from "./pages/Search";
import { PlaylistsPage } from "./pages/Playlists";
import { SettingsPage } from "./pages/Settings";
import { useAppStore } from "./stores/appStore";

export default function App() {
  const init = useAppStore((s) => s.init);
  const ready = useAppStore((s) => s.ready);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-ink-900 text-white">
      <BackgroundFX />
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-5 sm:p-8 max-w-[1600px] mx-auto">
            {ready && (
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/live"
                  element={<ChannelsPage kind="live" title="البث المباشر" variant="tile" />}
                />
                <Route
                  path="/movies"
                  element={<ChannelsPage kind="movie" title="الأفلام" />}
                />
                <Route
                  path="/series"
                  element={<ChannelsPage kind="series" title="المسلسلات" />}
                />
                <Route path="/series/:id" element={<SeriesDetailPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/playlists" element={<PlaylistsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            )}
          </div>
        </div>
      </main>
      <PlayerModal />
    </div>
  );
}
