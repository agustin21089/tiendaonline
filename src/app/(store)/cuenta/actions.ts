"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: (formData.get("name") as string) || undefined,
      phone: (formData.get("phone") as string) || null,
      dni: (formData.get("dni") as string) || null,
      birthDate: formData.get("birthDate")
        ? new Date(formData.get("birthDate") as string)
        : null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
    },
  });

  revalidatePath("/cuenta/perfil");
  return { success: true };
}
