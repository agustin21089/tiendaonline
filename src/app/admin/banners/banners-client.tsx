"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BannerForm } from "./banner-form";
import { toggleBanner } from "./actions";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Eye, EyeOff, Pencil } from "lucide-react";
import type { Banner } from "@/generated/prisma/client";

export function BannersClient({ banners }: { banners: Banner[] }) {
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    try {
      await toggleBanner(id, active);
      toast.success(active ? "Banner activado" : "Banner desactivado");
    } catch {
      toast.error("Error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-warm-500">{banners.length} banner{banners.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => { setShowNew(true); setEditId(null); }}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo banner
        </Button>
      </div>

      {showNew && !editId && (
        <div className="bg-white rounded-xl border border-arena-200 p-6">
          <h2 className="font-display text-base font-semibold text-warm-800 mb-4">
            Nuevo banner
          </h2>
          <BannerForm onDone={() => setShowNew(false)} />
        </div>
      )}

      {banners.length === 0 && !showNew ? (
        <div className="bg-white rounded-xl border border-arena-200 py-16 text-center text-warm-400">
          <p className="text-sm">No hay banners. Creá uno para el hero de la tienda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                banner.active ? "border-arena-200" : "border-arena-100 opacity-60"
              }`}
            >
              {editId === banner.id ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-base font-semibold text-warm-800">
                      Editar banner
                    </h2>
                  </div>
                  <BannerForm
                    banner={banner}
                    onDone={() => setEditId(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-16 rounded-lg overflow-hidden bg-arena-100 shrink-0">
                    <Image
                      src={banner.image}
                      alt={banner.title ?? "Banner"}
                      width={128}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {banner.title ?? "Sin título"}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {banner.position === "HOME_HERO" ? "Hero principal" : "Secundario"} · Orden {banner.order}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(banner.id, !banner.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        banner.active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-warm-400 hover:bg-arena-50"
                      }`}
                      title={banner.active ? "Desactivar" : "Activar"}
                    >
                      {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditId(banner.id); setShowNew(false); }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
