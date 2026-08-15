import type { ItemCategory, LayerSlot } from "./types";

export interface CategoryMeta {
  id: ItemCategory;
  label: string;
  slot: LayerSlot;
  emoji: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "camiseta", label: "Camisetas", slot: "top", emoji: "👕" },
  { id: "camisa", label: "Camisas", slot: "top", emoji: "👔" },
  { id: "blusa", label: "Blusas", slot: "top", emoji: "👚" },
  { id: "pantalon", label: "Pantalones", slot: "bottom", emoji: "👖" },
  { id: "falda", label: "Faldas", slot: "bottom", emoji: "👗" },
  { id: "vestido", label: "Vestidos", slot: "dress", emoji: "🎀" },
  { id: "abrigo", label: "Abrigos", slot: "coat", emoji: "🧥" },
  { id: "zapatos", label: "Zapatos", slot: "shoes", emoji: "👟" },
  { id: "bolso", label: "Bolsos", slot: "bag", emoji: "👜" },
  { id: "accesorio", label: "Accesorios", slot: "accessory", emoji: "✨" },
];

export const LAYER_ORDER: LayerSlot[] = [
  "bottom",
  "top",
  "dress",
  "coat",
  "shoes",
  "bag",
  "accessory",
];

export function categoryMeta(id: ItemCategory): CategoryMeta {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Categoría desconocida: ${id}`);
  return found;
}

export function slotForCategory(category: ItemCategory): LayerSlot {
  return categoryMeta(category).slot;
}
