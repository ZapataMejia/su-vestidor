import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../lib/categories";
import { db } from "../lib/db";
import { fileToWebpBlob } from "../lib/images";
import type { ClosetItem, ItemCategory } from "../lib/types";
import { BlobImage } from "../components/BlobImage";
import { Sheet } from "../components/Sheet";

const emptyForm = {
  name: "",
  category: "camiseta" as ItemCategory,
  colors: "",
  tags: "",
  favorite: false,
  unavailable: false,
};

export function ItemSheet({
  open,
  profileId,
  item,
  onClose,
}: {
  open: boolean;
  profileId: number;
  item: ClosetItem | null;
  onClose: () => void;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        colors: item.colors.join(", "),
        tags: item.tags.join(", "),
        favorite: item.favorite,
        unavailable: item.unavailable,
      });
      setImage(item.image);
    } else {
      setForm(emptyForm);
      setImage(null);
    }
    setError(null);
  }, [open, item]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const webp = await fileToWebpBlob(file);
      setImage(webp);
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!image) {
      setError("Agrega una foto de la prenda");
      return;
    }
    const name = form.name.trim() || "Sin nombre";
    const colors = form.colors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      if (isEdit && item?.id != null) {
        await db.items.update(item.id, {
          name,
          category: form.category,
          image,
          colors,
          tags,
          favorite: form.favorite,
          unavailable: form.unavailable,
          updatedAt: Date.now(),
        });
      } else {
        await db.items.add({
          profileId,
          name,
          category: form.category,
          image,
          colors,
          tags,
          favorite: form.favorite,
          unavailable: form.unavailable,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      onClose();
    } catch {
      setError("No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!item?.id) return;
    if (!confirm("¿Eliminar esta prenda?")) return;
    await db.items.delete(item.id);
    onClose();
  }

  return (
    <Sheet
      open={open}
      title={isEdit ? "Editar prenda" : "Nueva prenda"}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => void remove()}
              className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
            >
              Eliminar
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="ml-auto flex-1 rounded-full bg-blush-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-blush-300 bg-blush-50"
        >
          {image ? (
            <BlobImage
              blob={image}
              alt="Prenda"
              className="max-h-56 w-full object-contain p-2"
            />
          ) : (
            <div className="px-4 py-10 text-center text-sm text-ink-muted">
              Toca para elegir foto
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        <label className="block text-sm">
          <span className="text-ink-muted">Nombre</span>
          <input
            className="mt-1 w-full rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Blusa floreada"
          />
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted">Categoría</span>
          <select
            className="mt-1 w-full rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value as ItemCategory,
              }))
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted">Colores (separados por coma)</span>
          <input
            className="mt-1 w-full rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
            value={form.colors}
            onChange={(e) =>
              setForm((f) => ({ ...f, colors: e.target.value }))
            }
            placeholder="rosa, blanco"
          />
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted">Tags</span>
          <input
            className="mt-1 w-full rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="casual, oficina"
          />
        </label>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.favorite}
              onChange={(e) =>
                setForm((f) => ({ ...f, favorite: e.target.checked }))
              }
            />
            Favorita
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.unavailable}
              onChange={(e) =>
                setForm((f) => ({ ...f, unavailable: e.target.checked }))
              }
            />
            En lavandería
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Sheet>
  );
}
