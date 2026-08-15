import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { TabBar } from "./components/TabBar";
import type { OutfitSelection } from "./components/Mannequin";
import { db, ensureDbReady } from "./lib/db";
import type { ClosetItem, Look, TabId } from "./lib/types";
import { Closet } from "./screens/Closet";
import { Dresser } from "./screens/Dresser";
import { ItemSheet } from "./screens/ItemSheet";
import { Looks } from "./screens/Looks";
import { Settings } from "./screens/Settings";

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("dresser");
  const [itemSheet, setItemSheet] = useState<
    { mode: "add" } | { mode: "edit"; item: ClosetItem } | null
  >(null);
  const [wearSelection, setWearSelection] = useState<
    OutfitSelection | undefined
  >(undefined);
  const [dresserKey, setDresserKey] = useState(0);

  useEffect(() => {
    ensureDbReady()
      .then(() => setReady(true))
      .catch((err) => console.error(err));
  }, []);

  const settings = useLiveQuery(() => db.settings.get(1), []);
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? [];
  const activeProfileId = settings?.activeProfileId ?? null;
  const profile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  const items =
    useLiveQuery(
      () =>
        activeProfileId != null
          ? db.items.where("profileId").equals(activeProfileId).toArray()
          : Promise.resolve([] as ClosetItem[]),
      [activeProfileId],
    ) ?? [];

  const looks =
    useLiveQuery(
      () =>
        activeProfileId != null
          ? db.looks.where("profileId").equals(activeProfileId).toArray()
          : Promise.resolve([] as Look[]),
      [activeProfileId],
    ) ?? [];

  function wearLook(selection: OutfitSelection) {
    setWearSelection(selection);
    setDresserKey((k) => k + 1);
    setTab("dresser");
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-blush-50 font-sans text-ink-muted">
        Cargando vestidor…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-blush-50 font-sans text-ink">
      <main className="safe-pt mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-hidden px-3 py-3 sm:px-5">
        {tab === "dresser" ? (
          <Dresser
            key={dresserKey}
            profile={profile}
            items={items}
            initialSelection={wearSelection}
            onSavedLook={() => setTab("looks")}
          />
        ) : null}
        {tab === "closet" ? (
          <Closet
            items={items}
            onAdd={() => setItemSheet({ mode: "add" })}
            onEdit={(item) => setItemSheet({ mode: "edit", item })}
          />
        ) : null}
        {tab === "looks" ? (
          <Looks looks={looks} items={items} onWear={wearLook} />
        ) : null}
        {tab === "settings" ? (
          <Settings profile={profile} profiles={profiles} />
        ) : null}
      </main>
      <TabBar active={tab} onChange={setTab} />

      {profile?.id != null ? (
        <ItemSheet
          open={!!itemSheet}
          profileId={profile.id}
          item={itemSheet?.mode === "edit" ? itemSheet.item : null}
          onClose={() => setItemSheet(null)}
        />
      ) : null}
    </div>
  );
}
