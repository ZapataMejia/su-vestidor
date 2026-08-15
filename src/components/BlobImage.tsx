import { useEffect, useState, type CSSProperties } from "react";

/** Muestra un Blob como <img> con object URL y cleanup. */
export function BlobImage({
  blob,
  alt,
  className,
  style,
}: {
  blob?: Blob | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) {
    return (
      <div
        className={`bg-blush-100 flex items-center justify-center text-ink-soft ${className ?? ""}`}
        style={style}
        aria-label={alt}
      />
    );
  }

  return <img src={url} alt={alt} className={className} style={style} />;
}
