"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createProduct, updateProduct } from "./actions";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import type { Product, ProductImage } from "@/generated/prisma/client";

type Category = { id: string; name: string; parentId: string | null };

interface Props {
  product?: Product & { images: ProductImage[] };
  categories: Category[];
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!product);
  const [images, setImages] = useState<{ url: string; publicId?: string; alt?: string }[]>(
    product?.images.map((img) => ({ url: img.url, publicId: img.publicId ?? undefined, alt: img.alt ?? undefined })) ?? [],
  );

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product?.price.toString() ?? "",
    comparePrice: product?.comparePrice?.toString() ?? "",
    cost: product?.cost?.toString() ?? "",
    sku: product?.sku ?? "",
    stock: product?.stock.toString() ?? "0",
    trackStock: product?.trackStock ?? true,
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    weight: product?.weight?.toString() ?? "",
    categoryId: product?.categoryId ?? "",
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && autoSlug) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Seleccioná una categoría");
      return;
    }
    if (images.length === 0) {
      toast.error("Agregá al menos una imagen");
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        stock: parseInt(form.stock),
        weight: form.weight ? parseFloat(form.weight) : undefined,
      };

      if (product) {
        await updateProduct(product.id, data, images);
        toast.success("Producto actualizado");
      } else {
        await createProduct(data, images);
        toast.success("Producto creado");
      }
      router.push("/admin/productos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info básica */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Información básica</h2>

            <Input
              label="Nombre del producto"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Ej: Jarrón decorativo arena"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-warm-700">Slug (URL)</label>
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => {
                    set("slug", e.target.value);
                    setAutoSlug(false);
                  }}
                  className="flex-1 h-10 px-3 rounded-lg border border-arena-200 bg-white text-warm-800 text-sm
                    focus:outline-none focus:ring-2 focus:ring-arena-400 focus:border-transparent"
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

            <Textarea
              label="Descripción"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Describí el producto con detalle..."
            />
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-3">
            <h2 className="font-medium text-warm-800 text-sm">Imágenes</h2>
            <ImageUpload images={images} onChange={setImages} />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">SEO (opcional)</h2>
            <Input
              label="Meta título"
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder={form.name || "Título para buscadores"}
            />
            <Textarea
              label="Meta descripción"
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              rows={2}
              placeholder="Descripción breve para Google (160 caracteres)"
            />
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          {/* Precio */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Precios</h2>
            <Input
              label="Precio de venta"
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
              placeholder="0.00"
            />
            <Input
              label="Precio comparativo (tachado)"
              type="number"
              min={0}
              step={0.01}
              value={form.comparePrice}
              onChange={(e) => set("comparePrice", e.target.value)}
              hint="Precio antes del descuento"
              placeholder="0.00"
            />
            <Input
              label="Costo"
              type="number"
              min={0}
              step={0.01}
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              hint="Solo visible en el admin"
              placeholder="0.00"
            />
          </div>

          {/* Inventario */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Inventario</h2>
            <Input label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ABC-001" />
            <Input
              label="Stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.trackStock}
                onChange={(e) => set("trackStock", e.target.checked)}
                className="rounded border-arena-300"
              />
              <span className="text-sm text-warm-700">Controlar stock</span>
            </label>
            <Input
              label="Peso (kg)"
              type="number"
              min={0}
              step={0.01}
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              hint="Para calcular costo de envío"
            />
          </div>

          {/* Categoría y estado */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Organización</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-warm-700">Categoría</label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                required
                className="h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
              >
                <option value="">— Seleccioná una categoría —</option>
                {roots.map((root) => (
                  <>
                    <option key={root.id} value={root.id}>
                      {root.name}
                    </option>
                    {childrenOf(root.id).map((child) => (
                      <option key={child.id} value={child.id}>
                        &nbsp;&nbsp;└ {child.name}
                      </option>
                    ))}
                  </>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="rounded border-arena-300"
                />
                <span className="text-sm text-warm-700">Producto activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="rounded border-arena-300"
                />
                <span className="text-sm text-warm-700">Producto destacado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/productos")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {product ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
