"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/admin/image-upload";
import { createBanner, updateBanner, deleteBanner } from "./actions";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Banner } from "@/generated/prisma/client";

interface Props {
  banner?: Banner;
  onDone?: () => void;
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300";

export function BannerForm({ banner, onDone }: Props) {
  const [images, setImages] = useState<{ url: string; publicId?: string }[]>(
    banner?.image ? [{ url: banner.image, publicId: banner.publicId ?? undefined }] : []
  );
  const [loading, setLoading] = useState(false);
  const isEdit = !!banner;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("La imagen es obligatoria");
      return;
    }
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("image", images[0].url);
    data.set("active", String((form.elements.namedItem("active") as HTMLInputElement)?.checked ?? true));

    try {
      if (isEdit) {
        await updateBanner(banner.id, data);
        toast.success("Banner actualizado");
      } else {
        await createBanner(data);
        toast.success("Banner creado");
      }
      onDone?.();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!banner || !confirm("¿Eliminar este banner?")) return;
    setLoading(true);
    try {
      await deleteBanner(banner.id);
      toast.success("Banner eliminado");
      onDone?.();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">Imagen *</label>
        <ImageUpload images={images} onChange={setImages} maxImages={1} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Título</label>
          <input
            type="text"
            name="title"
            defaultValue={banner?.title ?? ""}
            className={inputClass}
            placeholder="Novedades primavera"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Subtítulo</label>
          <input
            type="text"
            name="subtitle"
            defaultValue={banner?.subtitle ?? ""}
            className={inputClass}
            placeholder="Nueva colección disponible"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Link (URL)</label>
          <input
            type="text"
            name="link"
            defaultValue={banner?.link ?? ""}
            className={inputClass}
            placeholder="/categoria/living"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Posición</label>
          <select
            name="position"
            defaultValue={banner?.position ?? "HOME_HERO"}
            className="w-full h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
          >
            <option value="HOME_HERO">Hero principal</option>
            <option value="HOME_SECONDARY">Secundario</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Orden</label>
          <input
            type="number"
            name="order"
            min={0}
            defaultValue={banner?.order ?? 0}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="active"
            id="active"
            defaultChecked={banner?.active ?? true}
            className="rounded border-arena-300 accent-arena-600"
          />
          <label htmlFor="active" className="text-sm font-medium text-warm-700">
            Activo
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {isEdit ? (
          <Button type="button" variant="danger" size="sm" onClick={handleDelete} loading={loading}>
            Eliminar
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {onDone && (
            <Button type="button" variant="outline" size="sm" onClick={onDone}>
              Cancelar
            </Button>
          )}
          <Button type="submit" loading={loading} size="sm">
            {isEdit ? "Guardar cambios" : "Crear banner"}
          </Button>
        </div>
      </div>
    </form>
  );
}
