import { prisma } from "@/lib/prisma";
import { saveSettings } from "./actions";
import { SettingsForm } from "./settings-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const params = await searchParams;
  const raw = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  // Prisma returns Decimal objects which can't be passed to Client Components —
  // convert to a plain-object representation before serialising over the wire.
  const settings = raw
    ? { ...raw, freeShippingMin: raw.freeShippingMin !== null ? Number(raw.freeShippingMin) : null }
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Configuración</h1>
        <p className="text-sm text-warm-500 mt-0.5">Datos generales de tu tienda</p>
      </div>

      {params.ok && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          ✓ Configuración guardada correctamente
        </div>
      )}

      <SettingsForm settings={settings} action={saveSettings} />
    </div>
  );
}
