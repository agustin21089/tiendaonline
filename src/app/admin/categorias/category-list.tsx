"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen, Folder } from "lucide-react";
import { CategoryForm } from "./category-form";
import { deleteCategory, toggleCategoryActive } from "./actions";
import { toast } from "sonner";
import type { Category } from "@/generated/prisma/client";

type CategoryWithMeta = Category & {
  parent: { name: string } | null;
  children: { id: string }[];
  _count: { products: number };
};

interface Props {
  categories: CategoryWithMeta[];
}

export function CategoryList({ categories }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithMeta | null>(null);

  const roots = categories.filter((c) => !c.parentId);
  const byParent = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  async function handleDelete(cat: CategoryWithMeta) {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success("Categoría eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  async function handleToggle(cat: CategoryWithMeta) {
    try {
      await toggleCategoryActive(cat.id, !cat.active);
      toast.success(cat.active ? "Categoría desactivada" : "Categoría activada");
    } catch {
      toast.error("Error al actualizar");
    }
  }

  function CategoryRow({ cat, depth = 0 }: { cat: CategoryWithMeta; depth?: number }) {
    const children = byParent(cat.id);
    const Icon = children.length > 0 ? FolderOpen : Folder;

    return (
      <>
        <tr className="group hover:bg-arena-50 transition-colors">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
              {depth > 0 && <ChevronRight className="w-3.5 h-3.5 text-warm-300 shrink-0" />}
              <Icon className="w-4 h-4 text-arena-400 shrink-0" />
              <span className="text-sm font-medium text-warm-800">{cat.name}</span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-warm-500">{cat.slug}</td>
          <td className="px-4 py-3">
            <Badge variant={cat.active ? "success" : "default"}>
              {cat.active ? "Activa" : "Inactiva"}
            </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-warm-500 text-center">
            {cat._count.products}
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingCategory(cat);
                  setShowForm(true);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleToggle(cat)}>
                <span className="text-xs">{cat.active ? "Desactivar" : "Activar"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(cat)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </td>
        </tr>
        {children.map((child) => (
          <CategoryRow key={child.id} cat={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-arena-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-arena-100 flex items-center justify-between">
          <span className="text-sm font-medium text-warm-700">
            {categories.length} categorías
          </span>
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-arena-100 bg-arena-50">
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Slug
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide text-center">
                Productos
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-50">
            {roots.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-warm-400 text-sm">
                  No hay categorías aún. Creá la primera.
                </td>
              </tr>
            ) : (
              roots.map((root) => <CategoryRow key={root.id} cat={root} />)
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CategoryForm
          categories={categories}
          editingCategory={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </>
  );
}
