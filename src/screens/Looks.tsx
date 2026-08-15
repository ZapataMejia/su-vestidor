import { useMemo, useRef, useState } from "react";
import { db } from "../lib/db";
import { fileToWebpBlob } from "../lib/images";
import type { ClosetItem, Look } from "../lib/types";
import { BlobImage } from "../components/BlobImage";
import { selectionFromItems, type OutfitSelection } from "../components/Mannequin";
import { Sheet } from "../components/Sheet";

export function Looks({
  looks,
  items,
  onWear,
}: {
  looks: Look[];
  items: ClosetItem[];
  onWear: (selection: OutfitSelection) => void;
}) {
  const [detail, setDetail] = useState<Look | null>(null);
  const [busy, setBusy] = useState(false);
  const wornRef = useRef<HTMLInputElement>(null);

  const itemsById = useMemo(() => {
    const map = new Map<number, ClosetItem>();
    for (const i of items) {
      if (i.id != null) map.set(i.id, i);
    }
    return map;
  }, [items]);

  const sorted = useMemo(
    () => [...looks].sort((a, b) => b.createdAt - a.createdAt),
    [looks],
  );

  async function attachWorn(file: File | undefined) {
    if (!detail?.id || !file) return;
    setBusy(true);
    try {
      const webp = await fileToWebpBlob(file, 1400);
      await db.looks.update(detail.id, {
        wornPhoto: webp,
        wornAt: Date.now(),
      });
      const updated = await db.looks.get(detail.id);
      setDetail(updated ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function removeLook() {
    if (!detail?.id) return;
    if (!confirm("¿Eliminar este look?")) return;
    await db.looks.delete(detail.id);
    setDetail(null);
  }

  function wearAgain(look: Look) {
    const selected = look.itemIds
      .map((id) => itemsById.get(id))
      .filter((i): i is ClosetItem => !!i);
    onWear(selectionFromItems(selected));
    setDetail(null);
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-blush-500">
          Estilos guardados
        </p>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Looks</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {sorted.length === 0 ? (
          <div className="mt-10 rounded-sheet bg-white/70 p-8 text-center shadow-soft">
            <p className="font-display text-xl text-ink">Sin looks aún</p>
            <p className="mt-2 text-sm text-ink-muted">
              Arma un outfit en Hoy y tócalo en Guardar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sorted.map((look) => (
              <button
                key={look.id}
                type="button"
                onClick={() => setDetail(look)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-soft"
              >
                <BlobImage
                  blob={look.wornPhoto ?? look.previewSnapshot}
                  alt={look.name}
                  className="aspect-square w-full object-cover bg-blush-50"
                />
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium text-ink">
                    {look.name}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {new Date(look.createdAt).toLocaleDateString("es-CO")}
                    {look.wornPhoto ? " · foto real" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={!!detail}
        title={detail?.name ?? "Look"}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => wearAgain(detail)}
                className="flex-1 rounded-full bg-blush-500 py-2.5 text-sm font-semibold text-white"
              >
                Poner en vestidor
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => wornRef.current?.click()}
                className="rounded-full border border-blush-200 px-4 py-2.5 text-sm"
              >
                {detail.wornPhoto ? "Cambiar foto" : "Así me queda"}
              </button>
              <button
                type="button"
                onClick={() => void removeLook()}
                className="rounded-full border border-red-200 px-4 py-2.5 text-sm text-red-600"
              >
                Eliminar
              </button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4">
            <BlobImage
              blob={detail.wornPhoto ?? detail.previewSnapshot}
              alt={detail.name}
              className="mx-auto max-h-72 w-full rounded-2xl object-contain bg-blush-50"
            />
            {detail.wornPhoto && detail.previewSnapshot ? (
              <div>
                <p className="mb-1 text-xs text-ink-muted">Preview del armario</p>
                <BlobImage
                  blob={detail.previewSnapshot}
                  alt="Preview"
                  className="h-24 w-24 rounded-xl object-cover"
                />
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                Prendas
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {detail.itemIds.map((id) => {
                  const item = itemsById.get(id);
                  if (!item) return null;
                  return (
                    <div
                      key={id}
                      className="w-20 shrink-0 overflow-hidden rounded-xl bg-blush-50"
                    >
                      <BlobImage
                        blob={item.image}
                        alt={item.name}
                        className="aspect-square w-full object-contain p-1"
                      />
                      <p className="truncate px-1 pb-1 text-[10px]">
                        {item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <input
              ref={wornRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => void attachWorn(e.target.files?.[0])}
            />
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
