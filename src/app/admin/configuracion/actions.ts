"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveSettings(prevState: { error?: string }, formData: FormData) {
  const storeName = formData.get("storeName") as string;
  if (!storeName?.trim()) {
    return { error: "El nombre de la tienda es obligatorio." };
  }

  const emailOrderTemplate = (formData.get("emailOrderTemplate") as string) || null;
  const emailVerifyTemplate = (formData.get("emailVerifyTemplate") as string) || null;

  // Appearance
  const primaryColor = (formData.get("primaryColor") as string) || "#B07D45";
  const neutralColor = (formData.get("neutralColor") as string) || "#787868";
  const darkMode = (formData.get("darkMode") as string) === "true";
  const logo = (formData.get("logo") as string) || null;
  const logoPublicId = (formData.get("logoPublicId") as string) || null;

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
      adminWhatsapp: (formData.get("adminWhatsapp") as string) || null,
      emailOrderTemplate,
      emailVerifyTemplate,
      primaryColor,
      neutralColor,
      darkMode,
      logo,
      logoPublicId,
    },
    create: {
      id: "singleton",
      storeName: storeName.trim(),
      primaryColor,
      neutralColor,
      darkMode,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracion");
  redirect("/admin/configuracion?ok=1");
}
