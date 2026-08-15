export async function fileToWebpBlob(
  file: Blob,
  maxSize = 1200,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen");
  return blob;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Collage simple de hasta 4 prendas para preview del look. */
export async function composeLookPreview(
  images: Blob[],
  size = 512,
): Promise<Blob | undefined> {
  if (images.length === 0) return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.fillStyle = "#faf6f7";
  ctx.fillRect(0, 0, size, size);

  const tiles = images.slice(0, 4);
  const cols = tiles.length === 1 ? 1 : 2;
  const rows = tiles.length <= 2 ? 1 : 2;
  const tw = size / cols;
  const th = size / rows;

  for (let i = 0; i < tiles.length; i++) {
    const bitmap = await createImageBitmap(tiles[i]!);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const scale = Math.min(tw / bitmap.width, th / bitmap.height) * 0.88;
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    const x = col * tw + (tw - w) / 2;
    const y = row * th + (th - h) / 2;
    ctx.drawImage(bitmap, x, y, w, h);
    bitmap.close();
  }

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? undefined), "image/webp", 0.85),
  );
}
