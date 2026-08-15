import { useEffect, useRef, useState } from "react";
import {
  downloadJson,
  exportBackup,
  importBackup,
  type VestidorBackup,
} from "../lib/backup";
import { db } from "../lib/db";
import { fileToWebpBlob } from "../lib/images";
import type { Profile } from "../lib/types";
import { BlobImage } from "../components/BlobImage";

export function Settings({
  profile,
  profiles,
}: {
  profile: Profile | null;
  profiles: Profile[];
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const baseRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
  }, [profile?.id, profile?.name]);

  async function saveName() {
    if (!profile?.id) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await db.profiles.update(profile.id, { name: trimmed });
      setStatus("Nombre actualizado");
    } finally {
      setBusy(false);
    }
  }

  async function onBaseImage(file: File | undefined) {
    if (!profile?.id || !file) return;
    setBusy(true);
    try {
      const webp = await fileToWebpBlob(file, 1400);
      await db.profiles.update(profile.id, { baseImage: webp });
      setStatus("Foto base del maniquí actualizada");
    } catch {
      setStatus("No se pudo guardar la foto base");
    } finally {
      setBusy(false);
    }
  }

  async function clearBase() {
    if (!profile?.id) return;
    await db.profiles
      .where("id")
      .equals(profile.id)
      .modify((p) => {
        delete p.baseImage;
      });
    setStatus("Usando silueta genérica");
  }

  async function doExport() {
    setBusy(true);
    try {
      const backup = await exportBackup();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`su-vestidor-backup-${stamp}.json`, backup);
      setStatus("Backup descargado");
    } catch {
      setStatus("Error al exportar");
    } finally {
      setBusy(false);
    }
  }

  async function doImport(file: File | undefined) {
    if (!file) return;
    if (
      !confirm(
        "Esto reemplazará armario, looks y perfiles de este dispositivo. ¿Continuar?",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as VestidorBackup;
      await importBackup(data, "replace");
      setStatus("Backup importado");
    } catch {
      setStatus("Backup inválido");
    } finally {
      setBusy(false);
    }
  }

  async function switchProfile(id: number) {
    await db.settings.put({ id: 1, activeProfileId: id });
    const p = profiles.find((x) => x.id === id);
    if (p) setName(p.name);
    setStatus(`Perfil activo: ${p?.name ?? id}`);
  }

  async function addProfile() {
    const label = prompt("Nombre del nuevo perfil", "Santiago");
    if (!label?.trim()) return;
    const id = await db.profiles.add({
      name: label.trim(),
      createdAt: Date.now(),
    });
    await db.settings.put({ id: 1, activeProfileId: id });
    setName(label.trim());
    setStatus(`Perfil ${label.trim()} creado`);
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pb-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-blush-500">
          Preferencias
        </p>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Ajustes</h1>
      </header>

      <section className="rounded-sheet bg-white p-4 shadow-soft space-y-3">
        <h2 className="font-semibold text-ink">Perfil activo</h2>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => p.id != null && void switchProfile(p.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                p.id === profile?.id
                  ? "bg-blush-500 text-white"
                  : "border border-blush-200 text-ink-muted"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void addProfile()}
            className="rounded-full border border-dashed border-blush-300 px-3 py-1.5 text-sm text-blush-600"
          >
            + Perfil
          </button>
        </div>

        <label className="block text-sm">
          <span className="text-ink-muted">Nombre</span>
          <div className="mt-1 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-blush-200 px-3 py-2 outline-none focus:border-blush-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveName()}
              className="rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </label>
      </section>

      <section className="rounded-sheet bg-white p-4 shadow-soft space-y-3">
        <h2 className="font-semibold text-ink">Maniquí / foto base</h2>
        <p className="text-sm text-ink-muted">
          Opcional: foto de cuerpo entero (fondo simple). Si no, usamos
          silueta.
        </p>
        <div className="flex items-center gap-4">
          <div className="h-32 w-20 overflow-hidden rounded-2xl bg-blush-50">
            {profile?.baseImage ? (
              <BlobImage
                blob={profile.baseImage}
                alt="Base"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-soft">
                Silueta
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => baseRef.current?.click()}
              className="rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Subir foto
            </button>
            {profile?.baseImage ? (
              <button
                type="button"
                onClick={() => void clearBase()}
                className="rounded-full border border-blush-200 px-4 py-2 text-sm"
              >
                Quitar
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={baseRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onBaseImage(e.target.files?.[0])}
        />
      </section>

      <section className="rounded-sheet bg-white p-4 shadow-soft space-y-3">
        <h2 className="font-semibold text-ink">Backup</h2>
        <p className="text-sm text-ink-muted">
          Los datos viven en este navegador. Exporta para pasar de tablet a
          celular o por si limpia el historial.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void doExport()}
            className="rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Exportar backup
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => importRef.current?.click()}
            className="rounded-full border border-blush-200 px-4 py-2 text-sm"
          >
            Importar backup
          </button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void doImport(e.target.files?.[0])}
        />
      </section>

      {status ? (
        <p className="rounded-xl bg-blush-100 px-3 py-2 text-sm text-blush-800">
          {status}
        </p>
      ) : null}

      <p className="text-center text-xs text-ink-soft">
        Su Vestidor · datos solo en este dispositivo · v0.1
      </p>
    </div>
  );
}
