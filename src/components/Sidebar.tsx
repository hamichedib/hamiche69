import { NavLink } from "react-router-dom";
import {
  Clapperboard,
  Film,
  Heart,
  Home,
  Search,
  Settings,
  Tv,
  List,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/appStore";

const items = [
  { to: "/", icon: Home, label: "الرئيسية" },
  { to: "/live", icon: Tv, label: "البث المباشر" },
  { to: "/movies", icon: Film, label: "الأفلام" },
  { to: "/series", icon: Clapperboard, label: "المسلسلات" },
  { to: "/favorites", icon: Heart, label: "المفضلة" },
  { to: "/search", icon: Search, label: "بحث" },
  { to: "/playlists", icon: List, label: "القوائم" },
  { to: "/settings", icon: Settings, label: "الإعدادات" },
];

export function Sidebar() {
  const compact = useAppStore((s) => s.settings.compactSidebar);
  return (
    <aside
      className={cn(
        "glass-strong shrink-0 h-full flex flex-col gap-1 p-3 transition-all duration-300",
        compact ? "w-[72px]" : "w-[232px]",
      )}
    >
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-accent-500 via-cine-purple to-cine-cyan shadow-glow flex items-center justify-center">
          <Clapperboard className="h-5 w-5 text-white" />
        </div>
        {!compact && (
          <div className="leading-tight">
            <div className="text-gradient font-extrabold text-lg tracking-wide">
              CINEMA 2026
            </div>
            <div className="text-[11px] text-white/50 font-medium">
              IPTV • Desktop
            </div>
          </div>
        )}
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn("nav-item", isActive && "nav-item-active", compact && "justify-center px-0")
            }
            title={label}
          >
            <Icon className="h-[18px] w-[18px]" />
            {!compact && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 py-3 text-[11px] text-white/40">
        {!compact && <div>v0.1.0 • بني ليكون سريعاً وأنيقاً</div>}
      </div>
    </aside>
  );
}
