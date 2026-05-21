"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBanner(formData: FormData) {
  await prisma.banner.create({
    data: {
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      image: formData.get("image") as string,
      link: (formData.get("link") as string) || null,
      order: Number(formData.get("order") ?? 0),
      active: formData.get("active") === "true",
      position: (formData.get("position") as "HOME_HERO" | "HOME_SECONDARY") ?? "HOME_HERO",
    },
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function updateBanner(id: string, formData: FormData) {
  await prisma.banner.update({
    where: { id },
    data: {
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      image: formData.get("image") as string,
      link: (formData.get("link") as string) || null,
      order: Number(formData.get("order") ?? 0),
      active: formData.get("active") === "true",
      position: (formData.get("position") as "HOME_HERO" | "HOME_SECONDARY") ?? "HOME_HERO",
    },
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBanner(id: string) {
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function toggleBanner(id: string, active: boolean) {
  await prisma.banner.update({ where: { id }, data: { active } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
