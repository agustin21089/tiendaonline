"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveSettings(prevState: { error?: string }, formData: FormData) {
  const storeName = formData.get("storeName") as string;
  if (!storeName?.trim()) {
    return { error: "El nombre de la tienda es obligatorio." };
  }

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      storeName: storeName.trim(),
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      whatsapp: (formData.get("whatsapp") as string) || null,
      instagram: (formData.get("instagram") as string) || null,
      facebook: (formData.get("facebook") as string) || null,
      freeShippingMin: formData.get("freeShippingMin")
        ? Number(formData.get("freeShippingMin"))
        : null,
      metaTitle: (formData.get("metaTitle") as string) || null,
      metaDescription: (formData.get("metaDescription") as string) || null,
    },
    create: {
      id: "singleton",
      storeName: storeName.trim(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracion");
  redirect("/admin/configuracion?ok=1");
}
