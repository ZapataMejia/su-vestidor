# Su Vestidor

PWA de vestidor digital (tablet-first, también móvil): armario de prendas, maniquí en capas, looks guardados y foto “así me queda”.

## Stack

- React + Vite + TypeScript + Tailwind
- Dexie (IndexedDB) — datos y fotos solo en el navegador
- PWA instalable (Vercel)

## Desarrollo

```bash
npm install
npm run dev
```

## Backup

En **Ajustes → Exportar / Importar backup** (incluye imágenes en base64). Úsalo para pasar de tablet a celular.

## Procesar fotos del armario

```bash
# fotos en scripts/process-closet/input/<categoria>/
npm run process-closet
```

Ver `scripts/process-closet/README.md`.

## Perfiles

MVP arranca con perfil “Ella”. En Ajustes puedes crear otro (p. ej. Santiago) sin cambiar el modelo de datos.
