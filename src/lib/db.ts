import Dexie, { type Table } from "dexie";
import type { AppSettings, ClosetItem, Look, Profile } from "./types";

export class VestidorDB extends Dexie {
  profiles!: Table<Profile, number>;
  items!: Table<ClosetItem, number>;
  looks!: Table<Look, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super("su-vestidor");
    this.version(1).stores({
      profiles: "++id, name, createdAt",
      items:
        "++id, profileId, category, favorite, unavailable, createdAt, updatedAt",
      looks: "++id, profileId, createdAt, wornAt",
      settings: "id",
    });
  }
}

export const db = new VestidorDB();

let ready: Promise<void> | null = null;

export function ensureDbReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.open();
      const existing = await db.settings.get(1);
      if (!existing) {
        const profileId = await db.profiles.add({
          name: "Ella",
          createdAt: Date.now(),
        });
        await db.settings.put({ id: 1, activeProfileId: profileId });
      } else if (existing.activeProfileId == null) {
        const first = await db.profiles.orderBy("id").first();
        if (first?.id != null) {
          await db.settings.put({ id: 1, activeProfileId: first.id });
        }
      }
    })();
  }
  return ready;
}

export async function getActiveProfileId(): Promise<number | null> {
  await ensureDbReady();
  const settings = await db.settings.get(1);
  return settings?.activeProfileId ?? null;
}
