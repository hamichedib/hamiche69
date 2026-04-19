import { cn } from "../lib/utils";

interface Props {
  categories: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  counts?: Record<string, number>;
}

export function CategoryTabs({ categories, value, onChange, counts }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      <button
        className={cn("chip shrink-0", value === null && "chip-active")}
        onClick={() => onChange(null)}
      >
        الكل
      </button>
      {categories.map((c) => (
        <button
          key={c}
          className={cn("chip shrink-0", value === c && "chip-active")}
          onClick={() => onChange(c)}
        >
          <span className="truncate max-w-[220px]">{c}</span>
          {counts?.[c] !== undefined && (
            <span className="text-white/50 text-[10px]">{counts[c]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
