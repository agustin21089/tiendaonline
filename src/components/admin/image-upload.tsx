"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, GripVertical, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ImageItem = { url: string; publicId?: string; alt?: string };

interface Props {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  async function uploadFiles(files: FileList) {
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setCloudinaryError(null);
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json() as { url?: string; publicId?: string; error?: string };

          if (!res.ok) {
            // Surface Cloudinary config error as a persistent message
            if (res.status === 503 && data.error) {
              throw new Error(data.error);
            }
            throw new Error(data.error ?? "Error al subir imagen");
          }
          return { url: data.url!, publicId: data.publicId };
        }),
      );
      onChange([...images, ...uploaded]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al subir imágenes";
      // If it's a Cloudinary config issue, show inline and switch to URL tab
      if (msg.includes("Cloudinary") || msg.includes("configurado")) {
        setCloudinaryError(msg);
        setTab("url");
      } else {
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  }

  function addByUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("La URL debe comenzar con http:// o https://");
      return;
    }
    if (images.length >= maxImages) {
      toast.error(`Máximo ${maxImages} imágenes`);
      return;
    }
    onChange([...images, { url: trimmed }]);
    setUrlInput("");
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

  const canAdd = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Cloudinary config error banner */}
      {cloudinaryError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-800 leading-relaxed">{cloudinaryError}</div>
        </div>
      )}

      {/* Tabs + upload area */}
      {canAdd && (
        <div>
          {/* Tab switcher */}
          <div className="flex text-sm border-b border-arena-200 mb-3">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 -mb-px border-b-2 transition-colors ${
                tab === "upload"
                  ? "border-arena-500 text-arena-700 font-medium"
                  : "border-transparent text-warm-400 hover:text-warm-700"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir archivo
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 -mb-px border-b-2 transition-colors ${
                tab === "url"
                  ? "border-arena-500 text-arena-700 font-medium"
                  : "border-transparent text-warm-400 hover:text-warm-700"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Agregar por URL
            </button>
          </div>

          {tab === "upload" ? (
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
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addByUrl())}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="flex-1 h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300"
              />
              <button
                type="button"
                onClick={addByUrl}
                disabled={!urlInput.trim()}
                className="px-3 h-9 rounded-lg bg-arena-600 text-white text-sm font-medium hover:bg-arena-700 transition-colors disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
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
                  unoptimized={img.url.startsWith("http") && !img.url.includes("cloudinary")}
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
