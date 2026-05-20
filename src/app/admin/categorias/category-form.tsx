"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { X } from "lucide-react";
import { createCategory, updateCategory } from "./actions";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import type { Category } from "@/generated/prisma/client";

type CategoryWithMeta = Category & {
  parent: { name: string } | null;
  children: { id: string }[];
  _count: { products: number };
};

interface Props {
  categories: CategoryWithMeta[];
  editingCategory: CategoryWithMeta | null;
  onClose: () => void;
}

export function CategoryForm({ categories, editingCategory, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(editingCategory?.name ?? "");
  const [slug, setSlug] = useState(editingCategory?.slug ?? "");
  const [description, setDescription] = useState(editingCategory?.description ?? "");
  const [parentId, setParentId] = useState(editingCategory?.parentId ?? "");
  const [active, setActive] = useState(editingCategory?.active ?? true);
  const [autoSlug, setAutoSlug] = useState(!editingCategory);

  useEffect(() => {
    if (autoSlug) setSlug(slugify(name));
  }, [name, autoSlug]);

  const availableParents = categories.filter(
    (c) => !c.parentId && c.id !== editingCategory?.id,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { name, slug, description, parentId, active, order: 0 };
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Categoría actualizada");
      } else {
        await createCategory(data);
        toast.success("Categoría creada");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
          <h2 className="font-display text-lg font-semibold text-warm-900">
            {editingCategory ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-arena-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Decoración de living"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-warm-700">Slug (URL)</label>
            <div className="flex gap-2">
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                className="flex-1 h-10 px-3 rounded-lg border border-arena-200 bg-white text-warm-800 text-sm
                  focus:outline-none focus:ring-2 focus:ring-arena-400 focus:border-transparent"
                placeholder="decoracion-de-living"
              />
              {!autoSlug && (
                <button
                  type="button"
                  onClick={() => setAutoSlug(true)}
                  className="px-2 text-xs text-arena-600 hover:text-arena-800 border border-arena-200 rounded-lg"
                >
                  Auto
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-warm-700">Categoría padre</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-arena-200 bg-white text-warm-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-arena-400 focus:border-transparent"
            >
              <option value="">— Ninguna (categoría raíz) —</option>
              {availableParents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción de la categoría..."
            rows={3}
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-arena-300 text-arena-500 focus:ring-arena-400"
            />
            <span className="text-sm text-warm-700">Categoría activa (visible en la tienda)</span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {editingCategory ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
