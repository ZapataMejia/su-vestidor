import { db, ensureDbReady } from "./db";
import { blobToDataUrl, dataUrlToBlob } from "./images";
import type {
  AppSettings,
  ClosetItem,
  ItemCategory,
  Look,
  Profile,
} from "./types";

export const BACKUP_VERSION = 1;

interface BackupProfile {
  name: string;
  baseImage?: string;
  createdAt: number;
}

interface BackupItem {
  profileName: string;
  category: ItemCategory;
  name: string;
  image: string;
  colors: string[];
  tags: string[];
  favorite: boolean;
  unavailable: boolean;
  createdAt: number;
  updatedAt: number;
  _tempId?: number;
}

interface BackupLook {
  profileName: string;
  name: string;
  itemTempIds: number[];
  previewSnapshot?: string;
  wornPhoto?: string;
  createdAt: number;
  wornAt?: number;
}

export interface VestidorBackup {
  version: number;
  exportedAt: string;
  activeProfileName: string | null;
  profiles: BackupProfile[];
  items: BackupItem[];
  looks: BackupLook[];
}

export async function exportBackup(): Promise<VestidorBackup> {
  await ensureDbReady();
  const [profiles, items, looks, settings] = await Promise.all([
    db.profiles.toArray(),
    db.items.toArray(),
    db.looks.toArray(),
    db.settings.get(1),
  ]);

  const profileById = new Map(
    profiles.filter((p) => p.id != null).map((p) => [p.id!, p]),
  );
  const active = settings?.activeProfileId
    ? profileById.get(settings.activeProfileId)
    : undefined;

  const backupProfiles: BackupProfile[] = [];
  for (const p of profiles) {
    backupProfiles.push({
      name: p.name,
      baseImage: p.baseImage ? await blobToDataUrl(p.baseImage) : undefined,
      createdAt: p.createdAt,
    });
  }

  const itemIdToTemp = new Map<number, number>();
  const backupItems: BackupItem[] = [];
  let temp = 1;
  for (const item of items) {
    const profile = profileById.get(item.profileId);
    if (!profile || item.id == null) continue;
    itemIdToTemp.set(item.id, temp);
    backupItems.push({
      profileName: profile.name,
      category: item.category,
      name: item.name,
      image: await blobToDataUrl(item.image),
      colors: item.colors,
      tags: item.tags,
      favorite: item.favorite,
      unavailable: item.unavailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      _tempId: temp,
    });
    temp += 1;
  }

  const backupLooks: BackupLook[] = [];
  for (const look of looks) {
    const profile = profileById.get(look.profileId);
    if (!profile) continue;
    backupLooks.push({
      profileName: profile.name,
      name: look.name,
      itemTempIds: look.itemIds
        .map((id) => itemIdToTemp.get(id))
        .filter((id): id is number => id != null),
      previewSnapshot: look.previewSnapshot
        ? await blobToDataUrl(look.previewSnapshot)
        : undefined,
      wornPhoto: look.wornPhoto
        ? await blobToDataUrl(look.wornPhoto)
        : undefined,
      createdAt: look.createdAt,
      wornAt: look.wornAt,
    });
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    activeProfileName: active?.name ?? null,
    profiles: backupProfiles,
    items: backupItems,
    looks: backupLooks,
  };
}

export async function importBackup(
  backup: VestidorBackup,
  mode: "replace" | "merge" = "replace",
): Promise<void> {
  await ensureDbReady();
  if (!backup || backup.version !== BACKUP_VERSION) {
    throw new Error("Backup inválido o versión no soportada");
  }

  await db.transaction(
    "rw",
    db.profiles,
    db.items,
    db.looks,
    db.settings,
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.looks.clear(),
          db.items.clear(),
          db.profiles.clear(),
        ]);
      }

      const nameToId = new Map<string, number>();
      if (mode === "merge") {
        const existing = await db.profiles.toArray();
        for (const p of existing) {
          if (p.id != null) nameToId.set(p.name, p.id);
        }
      }

      for (const p of backup.profiles) {
        if (mode === "merge" && nameToId.has(p.name)) continue;
        const profile: Profile = {
          name: p.name,
          baseImage: p.baseImage ? await dataUrlToBlob(p.baseImage) : undefined,
          createdAt: p.createdAt,
        };
        const id = await db.profiles.add(profile);
        nameToId.set(p.name, id);
      }

      const tempToReal = new Map<number, number>();
      for (const item of backup.items) {
        const profileId = nameToId.get(item.profileName);
        if (profileId == null) continue;
        const row: ClosetItem = {
          profileId,
          category: item.category,
          name: item.name,
          image: await dataUrlToBlob(item.image),
          colors: item.colors ?? [],
          tags: item.tags ?? [],
          favorite: !!item.favorite,
          unavailable: !!item.unavailable,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        const id = await db.items.add(row);
        if (item._tempId != null) tempToReal.set(item._tempId, id);
      }

      for (const look of backup.looks) {
        const profileId = nameToId.get(look.profileName);
        if (profileId == null) continue;
        const row: Look = {
          profileId,
          name: look.name,
          itemIds: look.itemTempIds
            .map((t) => tempToReal.get(t))
            .filter((id): id is number => id != null),
          previewSnapshot: look.previewSnapshot
            ? await dataUrlToBlob(look.previewSnapshot)
            : undefined,
          wornPhoto: look.wornPhoto
            ? await dataUrlToBlob(look.wornPhoto)
            : undefined,
          createdAt: look.createdAt,
          wornAt: look.wornAt,
        };
        await db.looks.add(row);
      }

      const activeName = backup.activeProfileName;
      const activeId =
        (activeName ? nameToId.get(activeName) : undefined) ??
        [...nameToId.values()][0] ??
        null;
      const settings: AppSettings = { id: 1, activeProfileId: activeId };
      await db.settings.put(settings);
    },
  );
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
