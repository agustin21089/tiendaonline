import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";
  if (!email) return Response.json({ unverified: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true, password: true },
  });

  // Only flag if credentials user (has password) and email not verified
  const unverified = !!(user?.password && !user.emailVerified);
  return Response.json({ unverified });
}
