"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createProduct, updateProduct, type VariantInput } from "./actions";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import type { Product, ProductImage, ProductVariant } from "@/generated/prisma/client";

type Category = { id: string; name: string; parentId: string | null };

interface Props {
  product?: Product & { images: ProductImage[]; variants?: ProductVariant[] };
  categories: Category[];
}

type VariantOption = {
  value: string;
  price: string;
  stock: string;
  sku: string; // hex for colors
};

type VariantGroup = {
  name: string;
  options: VariantOption[];
};

const VARIANT_TYPES = ["Tamaño", "Color", "Material", "Medida"] as const;

function emptyOption(): VariantOption {
  return { value: "", price: "", stock: "0", sku: "" };
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!product);
  const [images, setImages] = useState<{ url: string; publicId?: string; alt?: string }[]>(
    product?.images.map((img) => ({ url: img.url, publicId: img.publicId ?? undefined, alt: img.alt ?? undefined })) ?? [],
  );

  // Build variant groups from existing variants
  const buildGroups = (): VariantGroup[] => {
    if (!product?.variants?.length) return [];
    const map = new Map<string, VariantOption[]>();
    for (const v of product.variants) {
      if (!map.has(v.name)) map.set(v.name, []);
      map.get(v.name)!.push({
        value: v.value,
        price: v.price?.toString() ?? "",
        stock: v.stock.toString(),
        sku: v.sku ?? "",
      });
    }
    return Array.from(map.entries()).map(([name, options]) => ({ name, options }));
  };

  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(buildGroups);

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
      if (field === "name" && autoSlug) next.slug = slugify(value as string);
      return next;
    });
  }

  // Variant helpers
  function addGroup() {
    const usedNames = variantGroups.map((g) => g.name);
    const available = VARIANT_TYPES.find((t) => !usedNames.includes(t)) ?? "Variante";
    setVariantGroups((prev) => [...prev, { name: available, options: [emptyOption()] }]);
  }

  function removeGroup(idx: number) {
    setVariantGroups((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateGroupName(idx: number, name: string) {
    setVariantGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, name } : g)));
  }

  function addOption(gIdx: number) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === gIdx ? { ...g, options: [...g.options, emptyOption()] } : g)),
    );
  }

  function removeOption(gIdx: number, oIdx: number) {
    setVariantGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx ? { ...g, options: g.options.filter((_, j) => j !== oIdx) } : g,
      ),
    );
  }

  function updateOption(gIdx: number, oIdx: number, field: keyof VariantOption, value: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? {
              ...g,
              options: g.options.map((o, j) => (j === oIdx ? { ...o, [field]: value } : o)),
            }
          : g,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Seleccioná una categoría"); return; }
    if (images.length === 0) { toast.error("Agregá al menos una imagen"); return; }

    // Validate variants
    for (const g of variantGroups) {
      for (const o of g.options) {
        if (!o.value.trim()) { toast.error(`Completá el valor de la variante "${g.name}"`); return; }
      }
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

      const variants: VariantInput[] = variantGroups.flatMap((g) =>
        g.options.map((o) => ({
          name: g.name,
          value: o.value.trim(),
          price: o.price ? parseFloat(o.price) : null,
          stock: parseInt(o.stock) || 0,
          sku: g.name === "Color" ? (o.sku || null) : null,
        })),
      );

      if (product) {
        await updateProduct(product.id, data, images, variants);
        toast.success("Producto actualizado");
      } else {
        await createProduct(data, images, variants);
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
            <Input label="Nombre del producto" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Ej: Jarrón decorativo arena" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-warm-700">Slug (URL)</label>
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => { set("slug", e.target.value); setAutoSlug(false); }}
                  className="flex-1 h-10 px-3 rounded-lg border border-arena-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
                />
                {!autoSlug && (
                  <button type="button" onClick={() => setAutoSlug(true)} className="px-2 text-xs text-arena-600 border border-arena-200 rounded-lg">Auto</button>
                )}
              </div>
            </div>
            <Textarea label="Descripción" value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Describí el producto con detalle..." />
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-3">
            <h2 className="font-medium text-warm-800 text-sm">Imágenes</h2>
            <ImageUpload images={images} onChange={setImages} />
          </div>

          {/* Variantes */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-warm-800 text-sm">Variantes</h2>
              <Button type="button" variant="outline" size="sm" onClick={addGroup} disabled={variantGroups.length >= 3}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar tipo
              </Button>
            </div>

            {variantGroups.length === 0 && (
              <p className="text-sm text-warm-400 text-center py-4">
                Sin variantes. Agregá tamaños, colores u otras opciones.
              </p>
            )}

            {variantGroups.map((group, gIdx) => (
              <div key={gIdx} className="border border-arena-100 rounded-xl p-4 space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={group.name}
                      onChange={(e) => updateGroupName(gIdx, e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 appearance-none"
                    >
                      {VARIANT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="Otro">Otro</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-warm-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(gIdx)}
                    className="p-1.5 text-warm-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {group.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      {/* Color swatch if Color type */}
                      {group.name === "Color" && (
                        <input
                          type="color"
                          value={opt.sku || "#b08050"}
                          onChange={(e) => updateOption(gIdx, oIdx, "sku", e.target.value)}
                          title="Color hex"
                          className="w-9 h-9 rounded-lg border border-arena-200 cursor-pointer p-0.5 shrink-0"
                        />
                      )}
                      <input
                        type="text"
                        value={opt.value}
                        onChange={(e) => updateOption(gIdx, oIdx, "value", e.target.value)}
                        placeholder={group.name === "Color" ? "Ej: Beige" : group.name === "Tamaño" ? "Ej: Grande" : "Valor"}
                        className="flex-1 h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400"
                      />
                      <input
                        type="number"
                        value={opt.price}
                        onChange={(e) => updateOption(gIdx, oIdx, "price", e.target.value)}
                        placeholder="Precio"
                        min={0}
                        className="w-24 h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400"
                      />
                      <input
                        type="number"
                        value={opt.stock}
                        onChange={(e) => updateOption(gIdx, oIdx, "stock", e.target.value)}
                        placeholder="Stock"
                        min={0}
                        className="w-20 h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(gIdx, oIdx)}
                        disabled={group.options.length === 1}
                        className="p-1.5 text-warm-300 hover:text-red-500 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Labels row */}
                <div className={`flex gap-2 text-xs text-warm-400 ${group.name === "Color" ? "pl-11" : ""}`}>
                  <span className="flex-1">Valor *</span>
                  <span className="w-24">Precio (opt.)</span>
                  <span className="w-20">Stock</span>
                  <span className="w-8" />
                </div>

                <button
                  type="button"
                  onClick={() => addOption(gIdx)}
                  className="text-xs text-arena-600 hover:text-arena-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Agregar opción
                </button>
              </div>
            ))}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">SEO (opcional)</h2>
            <Input label="Meta título" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={form.name || "Título para buscadores"} />
            <Textarea label="Meta descripción" value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} placeholder="Descripción breve para Google (160 caracteres)" />
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          {/* Precio */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Precios</h2>
            <Input label="Precio de venta" type="number" min={0} step={0.01} value={form.price} onChange={(e) => set("price", e.target.value)} required placeholder="0.00" />
            <Input label="Precio comparativo (tachado)" type="number" min={0} step={0.01} value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} hint="Precio antes del descuento" placeholder="0.00" />
            <Input label="Costo" type="number" min={0} step={0.01} value={form.cost} onChange={(e) => set("cost", e.target.value)} hint="Solo visible en el admin" placeholder="0.00" />
          </div>

          {/* Inventario */}
          <div className="bg-white rounded-xl border border-arena-200 p-5 space-y-4">
            <h2 className="font-medium text-warm-800 text-sm">Inventario</h2>
            <Input label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ABC-001" />
            <Input label="Stock" type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.trackStock} onChange={(e) => set("trackStock", e.target.checked)} className="rounded border-arena-300" />
              <span className="text-sm text-warm-700">Controlar stock</span>
            </label>
            <Input label="Peso (kg)" type="number" min={0} step={0.01} value={form.weight} onChange={(e) => set("weight", e.target.value)} hint="Para calcular costo de envío" />
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
                <option value="">— Seleccioná —</option>
                {roots.map((root) => (
                  <>
                    <option key={root.id} value={root.id}>{root.name}</option>
                    {childrenOf(root.id).map((child) => (
                      <option key={child.id} value={child.id}>&nbsp;&nbsp;└ {child.name}</option>
                    ))}
                  </>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="rounded border-arena-300" />
                <span className="text-sm text-warm-700">Producto activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="rounded border-arena-300" />
                <span className="text-sm text-warm-700">Producto destacado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/productos")} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={loading} className="flex-1">{product ? "Guardar" : "Crear"}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
