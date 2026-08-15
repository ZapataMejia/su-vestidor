import { useMemo, useState } from "react";
import { CATEGORIES, slotForCategory } from "../lib/categories";
import { composeLookPreview } from "../lib/images";
import { db } from "../lib/db";
import type { ClosetItem, ItemCategory, Profile } from "../lib/types";
import {
  Mannequin,
  selectedItemIds,
  type OutfitSelection,
} from "../components/Mannequin";
import { BlobImage } from "../components/BlobImage";

export function Dresser({
  profile,
  items,
  initialSelection,
  onSavedLook,
}: {
  profile: Profile | null;
  items: ClosetItem[];
  initialSelection?: OutfitSelection;
  onSavedLook?: () => void;
}) {
  const [selection, setSelection] = useState<OutfitSelection>(
    initialSelection ?? {},
  );
  const [category, setCategory] = useState<ItemCategory>("camiseta");
  const [saving, setSaving] = useState(false);
  const [lookName, setLookName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const available = useMemo(
    () =>
      items.filter((i) => i.category === category && !i.unavailable),
    [items, category],
  );

  function pick(item: ClosetItem) {
    const slot = slotForCategory(item.category);
    setSelection((prev) => {
      const next = { ...prev };
      if (prev[slot]?.id === item.id) {
        delete next[slot];
        return next;
      }
      next[slot] = item;
      if (slot === "dress") {
        delete next.top;
        delete next.bottom;
      }
      if (slot === "top" || slot === "bottom") {
        delete next.dress;
      }
      return next;
    });
  }

  function clearAll() {
    setSelection({});
  }

  async function saveLook() {
    if (!profile?.id) return;
    const ids = selectedItemIds(selection);
    if (ids.length === 0) return;
    setSaving(true);
    try {
      const blobs = ids
        .map((id) => items.find((i) => i.id === id)?.image)
        .filter((b): b is Blob => !!b);
      const preview = await composeLookPreview(blobs);
      const name =
        lookName.trim() ||
        `Look ${new Date().toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
        })}`;
      await db.looks.add({
        profileId: profile.id,
        name,
        itemIds: ids,
        previewSnapshot: preview,
        createdAt: Date.now(),
      });
      setShowSave(false);
      setLookName("");
      onSavedLook?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blush-500">
            Outfit del día
          </p>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            {profile?.name ?? "Vestidor"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-blush-200 bg-white px-3 py-1.5 text-sm text-ink-muted"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => setShowSave(true)}
            disabled={selectedItemIds(selection).length === 0}
            className="rounded-full bg-blush-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:items-stretch">
        <div className="flex flex-1 items-center justify-center rounded-sheet bg-white/70 p-3 shadow-soft">
          <Mannequin profile={profile} selection={selection} />
        </div>

        <div className="flex min-h-[220px] flex-col gap-2 md:w-[340px] md:min-h-0 lg:w-[380px]">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                  category === c.id
                    ? "bg-blush-500 text-white"
                    : "bg-white text-ink-muted border border-blush-100"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-sheet bg-white/60 p-2 shadow-soft">
            {available.length === 0 ? (
              <p className="p-4 text-center text-sm text-ink-muted">
                No hay prendas en esta categoría. Agrégalas en Armario.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3">
                {available.map((item) => {
                  const slot = slotForCategory(item.category);
                  const selected = selection[slot]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => pick(item)}
                      className={`overflow-hidden rounded-2xl border-2 bg-white transition ${
                        selected
                          ? "border-blush-500 shadow-soft"
                          : "border-transparent"
                      }`}
                    >
                      <BlobImage
                        blob={item.image}
                        alt={item.name}
                        className="aspect-square w-full object-contain bg-blush-50 p-1"
                      />
                      <span className="block truncate px-1.5 py-1 text-[11px] text-ink">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSave ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-sheet bg-white p-4 shadow-lift">
            <h3 className="font-display text-lg text-ink">Guardar look</h3>
            <input
              className="mt-3 w-full rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
              placeholder="Nombre del look"
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-full border border-blush-200 py-2 text-sm"
                onClick={() => setShowSave(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 rounded-full bg-blush-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={saving}
                onClick={() => void saveLook()}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
