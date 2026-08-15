import { useEffect, type ReactNode } from "react";

export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-sheet bg-white shadow-lift sm:rounded-sheet animate-sheet">
        <div className="flex items-center justify-between border-b border-blush-100 px-4 py-3">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-ink-muted hover:bg-blush-50"
          >
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="safe-pb border-t border-blush-100 px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
