"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";

type Photo = {
  url: string;
  alt_text: string | null;
};

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">Photos</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={`${photo.url}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="aspect-square overflow-hidden rounded-xl border border-border transition-opacity hover:opacity-90"
          >
            <img
              src={photo.url}
              alt={photo.alt_text ?? ""}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i! > 0 ? i! - 1 : i))}
          onNext={() =>
            setLightboxIndex((i) =>
              i! < photos.length - 1 ? i! + 1 : i,
            )
          }
        />
      )}
    </section>
  );
}
