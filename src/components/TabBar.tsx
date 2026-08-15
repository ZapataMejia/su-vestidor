import type { TabId } from "../lib/types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "dresser", label: "Hoy", icon: "✦" },
  { id: "closet", label: "Armario", icon: "▣" },
  { id: "looks", label: "Looks", icon: "♡" },
  { id: "settings", label: "Ajustes", icon: "⚙" },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="safe-pb shrink-0 border-t border-blush-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl justify-around px-2 pt-2">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition ${
                isActive
                  ? "text-blush-600"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span
                className={`text-[11px] font-medium ${isActive ? "font-semibold" : ""}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
