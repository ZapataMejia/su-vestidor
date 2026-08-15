import { useMemo, useState } from "react";
import { CATEGORIES } from "../lib/categories";
import type { ClosetItem, ItemCategory } from "../lib/types";
import { BlobImage } from "../components/BlobImage";

export function Closet({
  items,
  onAdd,
  onEdit,
}: {
  items: ClosetItem[];
  onAdd: () => void;
  onEdit: (item: ClosetItem) => void;
}) {
  const [filter, setFilter] = useState<ItemCategory | "all">("all");
  const [onlyFav, setOnlyFav] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter !== "all" && i.category !== filter) return false;
      if (onlyFav && !i.favorite) return false;
      return true;
    });
  }, [items, filter, onlyFav]);

  const grouped = useMemo(() => {
    const map = new Map<ItemCategory, ClosetItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORIES.filter((c) => map.has(c.id)).map((c) => ({
      meta: c,
      items: map.get(c.id)!,
    }));
  }, [filtered]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blush-500">
            Tu ropa
          </p>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            Armario
          </h1>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
        >
          + Prenda
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-sm ${
            filter === "all"
              ? "bg-blush-500 text-white"
              : "bg-white border border-blush-100 text-ink-muted"
          }`}
        >
          Todo ({items.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c.id).length;
          if (count === 0) return null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === c.id
                  ? "bg-blush-500 text-white"
                  : "bg-white border border-blush-100 text-ink-muted"
              }`}
            >
              {c.emoji} {count}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOnlyFav((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-sm ${
            onlyFav
              ? "bg-blush-500 text-white"
              : "bg-white border border-blush-100 text-ink-muted"
          }`}
        >
          ♡ Favoritas
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {grouped.length === 0 ? (
          <div className="mt-10 rounded-sheet bg-white/70 p-8 text-center shadow-soft">
            <p className="font-display text-xl text-ink">Armario vacío</p>
            <p className="mt-2 text-sm text-ink-muted">
              Agrega fotos de tus prendas para empezar a armar outfits.
            </p>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 rounded-full bg-blush-500 px-5 py-2 text-sm font-semibold text-white"
            >
              Agregar primera prenda
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ meta, items: list }) => (
              <section key={meta.id}>
                <h2 className="mb-2 text-sm font-semibold text-ink-muted">
                  {meta.emoji} {meta.label}
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {list.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onEdit(item)}
                      className="relative overflow-hidden rounded-2xl bg-white shadow-soft"
                    >
                      <BlobImage
                        blob={item.image}
                        alt={item.name}
                        className={`aspect-square w-full object-contain bg-blush-50 p-1 ${
                          item.unavailable ? "opacity-40 grayscale" : ""
                        }`}
                      />
                      {item.favorite ? (
                        <span className="absolute right-1.5 top-1.5 text-blush-500">
                          ♡
                        </span>
                      ) : null}
                      {item.unavailable ? (
                        <span className="absolute bottom-1 left-1 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] text-white">
                          Lavandería
                        </span>
                      ) : null}
                      <span className="block truncate px-1.5 py-1 text-[11px] text-ink">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
