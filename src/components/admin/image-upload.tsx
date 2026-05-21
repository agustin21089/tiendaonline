"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

type ImageItem = { url: string; publicId?: string; alt?: string };

interface Props {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  async function uploadFiles(files: FileList) {
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Error al subir imagen");
          return res.json() as Promise<{ url: string; publicId: string }>;
        }),
      );
      onChange([...images, ...uploaded]);
    } catch {
      toast.error("Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(from: number, to: number) {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Zona de drop */}
      {images.length < maxImages && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-arena-200 rounded-xl p-6 flex flex-col items-center gap-2
            cursor-pointer hover:border-arena-400 hover:bg-arena-50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-arena-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-warm-500">Subiendo...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-arena-300" />
              <p className="text-sm text-warm-600 font-medium">
                Arrastrá imágenes acá o hacé click para subir
              </p>
              <p className="text-xs text-warm-400">
                PNG, JPG, WEBP hasta 10MB — {images.length}/{maxImages} imágenes
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={img.url + i}
              className="relative aspect-square group"
              draggable
              onDragStart={() => setDragging(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging !== null && dragging !== i) {
                  moveImage(dragging, i);
                  setDragging(null);
                }
              }}
            >
              <div className="w-full h-full rounded-lg overflow-hidden border border-arena-200 bg-arena-50">
                <Image
                  src={img.url}
                  alt={img.alt ?? `Imagen ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <div className="cursor-grab active:cursor-grabbing p-1 rounded text-white hover:bg-white/20">
                  <GripVertical className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="p-1 rounded text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Badge "Principal" */}
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-arena-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
