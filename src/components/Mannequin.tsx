import type { ClosetItem, LayerSlot, Profile } from "../lib/types";
import { LAYER_ORDER, slotForCategory } from "../lib/categories";
import { BlobImage } from "./BlobImage";

export type OutfitSelection = Partial<Record<LayerSlot, ClosetItem>>;

export function selectionFromItems(items: ClosetItem[]): OutfitSelection {
  const sel: OutfitSelection = {};
  for (const item of items) {
    sel[slotForCategory(item.category)] = item;
  }
  return sel;
}

export function selectedItemIds(sel: OutfitSelection): number[] {
  return LAYER_ORDER.map((slot) => sel[slot]?.id)
    .filter((id): id is number => id != null);
}

function Silhouette() {
  return (
    <svg
      viewBox="0 0 200 480"
      className="absolute inset-0 h-full w-full opacity-90"
      aria-hidden
    >
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d4d8" />
          <stop offset="100%" stopColor="#e4b8c2" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="48" rx="28" ry="32" fill="url(#skin)" />
      <path
        d="M72 88 C72 78, 128 78, 128 88 L138 200 C140 230, 136 260, 130 300 L125 420 L110 420 L108 310 L92 310 L90 420 L75 420 L70 300 C64 260, 60 230, 62 200 Z"
        fill="url(#skin)"
      />
      <path
        d="M72 100 C50 120, 42 160, 48 200 L62 198 C58 165, 64 130, 78 112 Z"
        fill="url(#skin)"
      />
      <path
        d="M128 100 C150 120, 158 160, 152 200 L138 198 C142 165, 136 130, 122 112 Z"
        fill="url(#skin)"
      />
    </svg>
  );
}

const LAYER_CLASS: Record<LayerSlot, string> = {
  bottom: "top-[38%] h-[42%] w-[58%] left-[21%]",
  top: "top-[18%] h-[34%] w-[62%] left-[19%]",
  dress: "top-[18%] h-[58%] w-[64%] left-[18%]",
  coat: "top-[16%] h-[48%] w-[72%] left-[14%]",
  shoes: "bottom-[2%] h-[14%] w-[46%] left-[27%]",
  bag: "top-[42%] h-[22%] w-[28%] right-[4%] left-auto",
  accessory: "top-[6%] h-[12%] w-[36%] left-[32%]",
};

export function Mannequin({
  profile,
  selection,
  className,
}: {
  profile?: Profile | null;
  selection: OutfitSelection;
  className?: string;
}) {
  const hasDress = !!selection.dress;
  const visibleSlots = LAYER_ORDER.filter((slot) => {
    if (!selection[slot]) return false;
    if (hasDress && (slot === "top" || slot === "bottom")) return false;
    return true;
  });

  return (
    <div
      className={`relative mx-auto aspect-[200/480] w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] ${className ?? ""}`}
    >
      <div className="absolute inset-0 rounded-[40%] bg-gradient-to-b from-blush-100/80 to-blush-200/40" />
      {profile?.baseImage ? (
        <BlobImage
          blob={profile.baseImage}
          alt={profile.name}
          className="absolute inset-0 h-full w-full object-contain object-bottom p-2"
        />
      ) : (
        <Silhouette />
      )}
      {visibleSlots.map((slot) => {
        const item = selection[slot]!;
        return (
          <BlobImage
            key={`${slot}-${item.id}`}
            blob={item.image}
            alt={item.name}
            className={`absolute object-contain drop-shadow-md pointer-events-none ${LAYER_CLASS[slot]}`}
          />
        );
      })}
    </div>
  );
}
