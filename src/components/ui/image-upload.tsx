"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  bucket: string;
  path: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
};

export function ImageUpload({
  bucket,
  path,
  value,
  onChange,
  label = "Upload image",
  className,
  accept = "image/png,image/jpeg,image/webp",
  maxSizeMB = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMB}MB.`);
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "jpg";
        const filePath = `${path}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        onChange(data.publicUrl);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
    [bucket, path, onChange, maxSizeMB],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload],
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  return (
    <div className={className}>
      {label && (
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      )}

      {value ? (
        <div className="group relative inline-block">
          <img
            src={value}
            alt=""
            className="h-32 w-32 rounded-xl border border-border object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <ImagePlus className="size-6" />
          )}
          <span className="text-xs">
            {uploading ? "Uploading..." : "Browse"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

type GalleryProps = {
  bucket: string;
  basePath: string;
  businessId: string;
  photos: GalleryPhoto[];
  onChange: (photos: GalleryPhoto[]) => void;
};

export type GalleryPhoto = {
  id?: string;
  url: string;
  altText: string;
  sortOrder: number;
};

export function GalleryUpload({
  bucket,
  basePath,
  businessId,
  photos,
  onChange,
}: GalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      try {
        const supabase = createClient();
        const newPhotos: GalleryPhoto[] = [...photos];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} exceeds 5 MB limit`);
            continue;
          }
          const ext = file.name.split(".").pop() ?? "jpg";
          const filePath = `${basePath}/${businessId}/${Date.now()}-${i}.${ext}`;

          const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: true });

          if (error) throw error;

          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          newPhotos.push({
            url: data.publicUrl,
            altText: file.name.replace(/\.[^.]+$/, ""),
            sortOrder: newPhotos.length,
          });
        }

        onChange(newPhotos);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Photo upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, basePath, businessId, photos, onChange],
  );

  const remove = useCallback(
    (index: number) => {
      const updated = photos
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, sortOrder: i }));
      onChange(updated);
    },
    [photos, onChange],
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, i) => (
          <div key={`${photo.url}-${i}`} className="group relative aspect-square">
            <img
              src={photo.url}
              alt={photo.altText}
              className="h-full w-full rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          <span className="text-[10px]">Add</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
