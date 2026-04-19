import { useNavigate } from "react-router-dom";
import { PlusCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function Empty({
  title = "لا توجد بيانات بعد",
  description = "أضف قائمة M3U أو اتصال Xtream Codes لعرض القنوات والأفلام والمسلسلات.",
  ctaHref = "/playlists?new=1",
  ctaLabel = "إضافة قائمة جديدة",
}: Props) {
  const nav = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-10 text-center flex flex-col items-center gap-4 max-w-xl mx-auto"
    >
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 via-cine-purple to-cine-cyan flex items-center justify-center shadow-glow">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white">{title}</div>
        <div className="mt-1 text-white/60">{description}</div>
      </div>
      <button className="btn-primary" onClick={() => nav(ctaHref)}>
        <PlusCircle className="h-4 w-4" /> {ctaLabel}
      </button>
    </motion.div>
  );
}
