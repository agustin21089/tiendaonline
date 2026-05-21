import { prisma } from "@/lib/prisma";
import { BannersClient } from "./banners-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Banners" };

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { order: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Banners</h1>
        <p className="text-sm text-warm-500 mt-0.5">Imágenes del hero y secciones destacadas</p>
      </div>
      <BannersClient banners={banners} />
    </div>
  );
}
