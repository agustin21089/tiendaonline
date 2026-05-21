"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function forgotPassword(
  email: string
): Promise<{ error?: string; ok?: boolean }> {
  const user = await prisma.user.findUnique({ where: { email } });

  // If no user OR Google-only account (no password), still return ok to avoid email enumeration
  if (!user || !user.password) return { ok: true };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
  await prisma.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  try {
    await sendPasswordResetEmail(email, user.name ?? "Usuario", token);
  } catch (e) {
    console.error("Error sending reset email:", e);
    return { error: "No se pudo enviar el email. Revisá la configuración SMTP." };
  }

  return { ok: true };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = z.string().min(6, "La contraseña debe tener al menos 6 caracteres").safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const record = await prisma.verificationToken.findFirst({ where: { token } });

  if (!record || !record.identifier.startsWith("reset:")) {
    return { error: "El enlace es inválido o ya fue usado." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    });
    return { error: "El enlace expiró. Solicitá uno nuevo." };
  }

  const email = record.identifier.replace("reset:", "");
  const hashed = await hash(password, 10);

  await prisma.user.update({ where: { email }, data: { password: hashed } });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  return { ok: true };
}
