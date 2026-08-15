#!/usr/bin/env node
/**
 * Procesa fotos del armario: redimensiona y (si hay rembg) quita fondo.
 *
 * Uso:
 *   1. Pon fotos en scripts/process-closet/input/<categoria>/
 *      Categorías: camisa, camiseta, blusa, pantalon, falda, vestido,
 *      zapatos, bolso, accesorio, abrigo
 *   2. npm run process-closet
 *   3. Resultados en scripts/process-closet/output/<categoria>/
 *
 * Opcional (fondo transparente):
 *   pip install rembg pillow
 *   Luego el script intentará usar `rembg` en PATH.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readdir, stat, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname);
const INPUT = path.join(ROOT, "input");
const OUTPUT = path.join(ROOT, "output");
const MANIFEST = path.join(OUTPUT, "manifest.json");

const CATEGORIES = new Set([
  "camisa",
  "camiseta",
  "blusa",
  "pantalon",
  "falda",
  "vestido",
  "zapatos",
  "bolso",
  "accesorio",
  "abrigo",
]);

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif"]);

function hasRembg() {
  const r = spawnSync("rembg", ["--help"], { encoding: "utf8" });
  return r.status === 0 || (r.stdout || r.stderr || "").includes("rembg");
}

async function ensureDirs() {
  await mkdir(INPUT, { recursive: true });
  await mkdir(OUTPUT, { recursive: true });
  for (const c of CATEGORIES) {
    await mkdir(path.join(INPUT, c), { recursive: true });
    await mkdir(path.join(OUTPUT, c), { recursive: true });
  }
}

async function listImages(dir) {
  try {
    const entries = await readdir(dir);
    return entries.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
  } catch {
    return [];
  }
}

async function processOne(inputPath, outputPath, useRembg) {
  let buffer = await readFile(inputPath);

  if (useRembg) {
    const tmpIn = inputPath;
    const r = spawnSync("rembg", ["i", tmpIn, outputPath], {
      encoding: "utf8",
    });
    if (r.status === 0) {
      buffer = await readFile(outputPath);
    } else {
      console.warn("  rembg falló, continuo con sharp:", path.basename(inputPath));
    }
  }

  await sharp(buffer)
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function main() {
  await ensureDirs();
  const useRembg = hasRembg();
  console.log(
    useRembg
      ? "rembg detectado — quitando fondos"
      : "sin rembg — solo resize a PNG (pip install rembg para fondos)",
  );

  const manifest = [];
  let count = 0;

  for (const category of CATEGORIES) {
    const files = await listImages(path.join(INPUT, category));
    for (const file of files) {
      const inPath = path.join(INPUT, category, file);
      const base = path.basename(file, path.extname(file));
      const outName = `${base}.png`;
      const outPath = path.join(OUTPUT, category, outName);
      process.stdout.write(`→ ${category}/${file} … `);
      await processOne(inPath, outPath, useRembg);
      const s = await stat(outPath);
      manifest.push({
        category,
        name: base.replace(/[-_]/g, " "),
        file: path.join(category, outName),
        bytes: s.size,
      });
      count += 1;
      console.log("ok");
    }
  }

  await writeFile(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), items: manifest }, null, 2));
  console.log(`\nListo: ${count} prendas → ${OUTPUT}`);
  console.log(`Manifest: ${MANIFEST}`);
  if (count === 0) {
    console.log(
      "\nPon fotos en scripts/process-closet/input/<categoria>/ y vuelve a correr.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
