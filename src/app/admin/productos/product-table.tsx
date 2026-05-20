"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { deleteProduct, toggleProductActive } from "./actions";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: { toString(): string };
  comparePrice: { toString(): string } | null;
  stock: number;
  active: boolean;
  featured: boolean;
  sku: string | null;
  category: { name: string };
  images: { url: string; alt: string | null }[];
};

interface Props {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  categories: { id: string; name: string; parentId: string | null }[];
  filters: { q?: string; categoria?: string; stockBajo?: string };
}

export function ProductTable({ products, total, page, perPage, categories, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q ?? "");

  const totalPages = Math.ceil(total / perPage);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("pagina");
    router.push(`/admin/productos?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter("q", search);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado");
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleProductActive(id, !active);
        toast.success(active ? "Producto desactivado" : "Producto activado");
      } catch {
        toast.error("Error al actualizar");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-arena-200 overflow-hidden">
      {/* Filtros */}
      <div className="px-4 py-3 border-b border-arena-100 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Buscar
          </Button>
        </form>

        <select
          value={filters.categoria ?? ""}
          onChange={(e) => applyFilter("categoria", e.target.value)}
          className="h-9 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? `  └ ${c.name}` : c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.stockBajo === "1"}
            onChange={(e) => applyFilter("stockBajo", e.target.checked ? "1" : "")}
            className="rounded border-arena-300"
          />
          Stock bajo
        </label>
      </div>

      {/* Tabla */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-arena-100 bg-arena-50">
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
              Producto
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
              Categoría
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide text-right">
              Precio
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide text-center">
              Stock
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-warm-500 uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-arena-50">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-warm-400 text-sm">
                No se encontraron productos
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="group hover:bg-arena-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-arena-100 shrink-0">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt ?? product.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-warm-300 text-xs">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-warm-400">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-warm-500">{product.category.name}</td>
                <td className="px-4 py-3 text-right">
                  <p className="text-sm font-semibold text-warm-800">
                    {formatPrice(Number(product.price))}
                  </p>
                  {product.comparePrice && (
                    <p className="text-xs text-warm-400 line-through">
                      {formatPrice(Number(product.comparePrice))}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm font-medium ${
                      product.stock <= 5
                        ? "text-red-600"
                        : product.stock <= 10
                          ? "text-yellow-600"
                          : "text-warm-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={product.active ? "success" : "default"}>
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                  {product.featured && (
                    <Badge variant="info" className="ml-1">
                      Destacado
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/productos/${product.id}`)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(product.id, product.active)}
                      disabled={isPending}
                    >
                      {product.active ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-arena-100 flex items-center justify-between">
          <p className="text-sm text-warm-500">
            Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => applyFilter("pagina", String(page - 1))}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => applyFilter("pagina", String(page + 1))}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
