"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().optional(),
  publicId: z.string().optional(),
  order: z.coerce.number().default(0),
  active: z.boolean().default(true),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.parse(data);
  const slug = parsed.slug || slugify(parsed.name);

  await prisma.category.create({
    data: {
      ...parsed,
      slug,
      parentId: parsed.parentId || null,
    },
  });

  revalidatePath("/admin/categorias");
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.parse(data);
  const slug = parsed.slug || slugify(parsed.name);

  await prisma.category.update({
    where: { id },
    data: {
      ...parsed,
      slug,
      parentId: parsed.parentId || null,
    },
  });

  revalidatePath("/admin/categorias");
}

export async function deleteCategory(id: string) {
  const hasProducts = await prisma.product.count({ where: { categoryId: id } });
  if (hasProducts > 0) {
    throw new Error("No se puede eliminar una categoría con productos asignados.");
  }

  const hasChildren = await prisma.category.count({ where: { parentId: id } });
  if (hasChildren > 0) {
    throw new Error("No se puede eliminar una categoría que tiene subcategorías.");
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
}

export async function toggleCategoryActive(id: string, active: boolean) {
  await prisma.category.update({ where: { id }, data: { active } });
  revalidatePath("/admin/categorias");
}
