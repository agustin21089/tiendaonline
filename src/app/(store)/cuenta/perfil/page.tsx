import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

// Always fetch fresh data from DB — never rely on the JWT session for profile fields
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cuenta/perfil");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      name: true,
      email: true,
      phone: true,
      dni: true,
      birthDate: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!dbUser) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Mi perfil</h1>
        <p className="text-sm text-warm-500 mt-0.5">Actualizá tus datos personales</p>
      </div>

      <ProfileForm
        initialData={{
          name:      dbUser.name      ?? "",
          email:     dbUser.email     ?? "",
          phone:     dbUser.phone     ?? "",
          dni:       dbUser.dni       ?? "",
          birthDate: dbUser.birthDate
            ? dbUser.birthDate.toISOString().slice(0, 10)
            : "",
          address:   dbUser.address   ?? "",
          city:      dbUser.city      ?? "",
          state:     dbUser.state     ?? "",
          zip:       dbUser.zip       ?? "",
        }}
      />
    </div>
  );
}
