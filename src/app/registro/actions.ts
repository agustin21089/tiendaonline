"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  dni: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export type RegisterState = { error?: string; success?: boolean; email?: string };

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: (formData.get("name") as string) || "",
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
    phone: (formData.get("phone") as string) || undefined,
    dni: (formData.get("dni") as string) || undefined,
    birthDate: (formData.get("birthDate") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    zip: (formData.get("zip") as string) || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const hashedPassword = await hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      phone: parsed.data.phone || null,
      dni: parsed.data.dni || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      zip: parsed.data.zip || null,
      role: "CUSTOMER",
    },
  });

  // Generate and store a 6-digit verification code
  const code = generateCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Remove any old tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: parsed.data.email } });

  await prisma.verificationToken.create({
    data: { identifier: parsed.data.email, token: code, expires },
  });

  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" }, select: { emailVerifyTemplate: true } })
    .catch(() => null);

  try {
    await sendVerificationEmail(parsed.data.email, parsed.data.name, code, settings?.emailVerifyTemplate);
  } catch (e) {
    console.error("Error sending verification email:", e);
    // Don't block registration if email fails — user can request resend
  }

  return { success: true, email: parsed.data.email };
}

export async function resendVerification(email: string): Promise<{ error?: string; ok?: boolean }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Usuario no encontrado." };
  if (user.emailVerified) return { error: "El email ya está verificado." };

  const code = generateCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: code, expires },
  });

  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" }, select: { emailVerifyTemplate: true } })
    .catch(() => null);

  try {
    await sendVerificationEmail(email, user.name ?? "Usuario", code, settings?.emailVerifyTemplate);
  } catch {
    return { error: "No se pudo enviar el email. Revisá la configuración SMTP." };
  }

  return { ok: true };
}

export async function verifyEmail(
  email: string,
  code: string
): Promise<{ error?: string; success?: boolean }> {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: code },
  });

  if (!record) return { error: "Código inválido." };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token: code } } });
    return { error: "El código expiró. Solicitá uno nuevo." };
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: code } },
  });

  return { success: true };
}
