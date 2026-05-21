"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  trackStock: z.boolean().default(true),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.coerce.number().optional(),
  categoryId: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export type VariantInput = {
  name: string;   // "Color" | "Tamaño"
  value: string;  // "Rojo" | "Grande"
  price?: number | null;
  stock: number;
  sku?: string | null; // hex for colors e.g. "#C0392B"
};

export async function createProduct(
  data: ProductFormData,
  images: { url: string; publicId?: string; alt?: string }[],
  variants: VariantInput[] = [],
) {
  const parsed = productSchema.parse(data);
  const slug = parsed.slug || slugify(parsed.name);

  const product = await prisma.product.create({
    data: {
      ...parsed,
      slug,
      comparePrice: parsed.comparePrice ?? null,
      cost: parsed.cost ?? null,
      sku: parsed.sku || null,
      weight: parsed.weight ?? null,
      images: {
        create: images.map((img, i) => ({ ...img, order: i })),
      },
      variants: variants.length > 0 ? {
        create: variants.map((v) => ({
          name: v.name,
          value: v.value,
          price: v.price ?? null,
          stock: v.stock,
          sku: v.sku || null,
        })),
      } : undefined,
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  return product;
}

export async function updateProduct(
  id: string,
  data: ProductFormData,
  images: { url: string; publicId?: string; alt?: string }[],
  variants: VariantInput[] = [],
) {
  const parsed = productSchema.parse(data);
  const slug = parsed.slug || slugify(parsed.name);

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        ...parsed,
        slug,
        comparePrice: parsed.comparePrice ?? null,
        cost: parsed.cost ?? null,
        sku: parsed.sku || null,
        weight: parsed.weight ?? null,
        images: {
          create: images.map((img, i) => ({ ...img, order: i })),
        },
        variants: variants.length > 0 ? {
          create: variants.map((v) => ({
            name: v.name,
            value: v.value,
            price: v.price ?? null,
            stock: v.stock,
            sku: v.sku || null,
          })),
        } : undefined,
      },
    }),
  ]);

  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function toggleProductActive(id: string, active: boolean) {
  await prisma.product.update({ where: { id }, data: { active } });
  revalidatePath("/admin/productos");
}

// ─── ACTUALIZACIÓN MASIVA DE PRECIOS ────────────────────────────────────────

const bulkPriceSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number(),
  operation: z.enum(["INCREASE", "DECREASE"]),
  categoryId: z.string().optional(),
  applyToComparePrice: z.boolean().default(false),
});

export type BulkPriceData = z.infer<typeof bulkPriceSchema>;

export async function previewBulkPrice(data: BulkPriceData) {
  const parsed = bulkPriceSchema.parse(data);
  const where = parsed.categoryId ? { categoryId: parsed.categoryId } : {};

  const products = await prisma.product.findMany({
    where,
    select: { id: true, name: true, price: true, comparePrice: true },
    take: 10,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    oldPrice: Number(p.price),
    newPrice: calcNewPrice(Number(p.price), parsed),
  }));
}

export async function applyBulkPrice(data: BulkPriceData) {
  const parsed = bulkPriceSchema.parse(data);
  const where = parsed.categoryId ? { categoryId: parsed.categoryId } : {};

  const products = await prisma.product.findMany({ where, select: { id: true, price: true, comparePrice: true } });

  await Promise.all(
    products.map((p) =>
      prisma.product.update({
        where: { id: p.id },
        data: {
          price: calcNewPrice(Number(p.price), parsed),
          ...(parsed.applyToComparePrice && p.comparePrice
            ? { comparePrice: calcNewPrice(Number(p.comparePrice), parsed) }
            : {}),
        },
      }),
    ),
  );

  revalidatePath("/admin/productos");
  revalidatePath("/");
}

function calcNewPrice(
  current: number,
  opts: { type: "PERCENTAGE" | "FIXED"; value: number; operation: "INCREASE" | "DECREASE" },
): number {
  let delta = opts.type === "PERCENTAGE" ? (current * opts.value) / 100 : opts.value;
  const result = opts.operation === "INCREASE" ? current + delta : current - delta;
  return Math.max(0, Math.round(result * 100) / 100);
}

// ─── ACTUALIZACIÓN DE STOCK POR CSV ──────────────────────────────────────────

export type StockCsvRow = { identifier: string; stock: number };
export type StockCsvResult = {
  updated: number;
  errors: { row: number; identifier: string; reason: string }[];
};

/**
 * Accepts parsed CSV rows [{identifier, stock}] and updates each product.
 * `identifier` can be SKU or product ID.
 */
export async function updateStockFromCsv(rows: StockCsvRow[]): Promise<StockCsvResult> {
  const errors: StockCsvResult["errors"] = [];
  let updated = 0;

  // Collect all identifiers and batch-fetch
  const skus = rows.map((r) => r.identifier);
  const products = await prisma.product.findMany({
    where: { OR: [{ sku: { in: skus } }, { id: { in: skus } }] },
    select: { id: true, sku: true },
  });

  const byId = new Map(products.map((p) => [p.id, p.id]));
  const bySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku!, p.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const productId = byId.get(row.identifier) ?? bySku.get(row.identifier);

    if (!productId) {
      errors.push({ row: i + 1, identifier: row.identifier, reason: "Producto no encontrado" });
      continue;
    }

    if (!Number.isInteger(row.stock) || row.stock < 0) {
      errors.push({ row: i + 1, identifier: row.identifier, reason: "Stock debe ser un entero ≥ 0" });
      continue;
    }

    try {
      await prisma.product.update({ where: { id: productId }, data: { stock: row.stock } });
      updated++;
    } catch {
      errors.push({ row: i + 1, identifier: row.identifier, reason: "Error al actualizar" });
    }
  }

  revalidatePath("/admin/productos");
  return { updated, errors };
}
