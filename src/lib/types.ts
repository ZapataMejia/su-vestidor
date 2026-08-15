export type ItemCategory =
  | "camisa"
  | "camiseta"
  | "blusa"
  | "pantalon"
  | "falda"
  | "vestido"
  | "zapatos"
  | "bolso"
  | "accesorio"
  | "abrigo";

export type LayerSlot =
  | "bottom"
  | "top"
  | "dress"
  | "coat"
  | "shoes"
  | "bag"
  | "accessory";

export interface Profile {
  id?: number;
  name: string;
  baseImage?: Blob;
  createdAt: number;
}

export interface ClosetItem {
  id?: number;
  profileId: number;
  category: ItemCategory;
  name: string;
  image: Blob;
  colors: string[];
  tags: string[];
  favorite: boolean;
  unavailable: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Look {
  id?: number;
  profileId: number;
  name: string;
  itemIds: number[];
  previewSnapshot?: Blob;
  wornPhoto?: Blob;
  createdAt: number;
  wornAt?: number;
}

export interface AppSettings {
  id: 1;
  activeProfileId: number | null;
}

export type TabId = "dresser" | "closet" | "looks" | "settings";
