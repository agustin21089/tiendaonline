"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Shipping Zones ────────────────────────────────────────────────────────────

export async function createShippingZone(name: string, provinces: string[]) {
  await prisma.shippingZone.create({
    data: { name, provinces, active: true },
  });
  revalidatePath("/admin/envios");
}

export async function updateShippingZone(
  id: string,
  name: string,
  provinces: string[],
  active: boolean
) {
  await prisma.shippingZone.update({
    where: { id },
    data: { name, provinces, active },
  });
  revalidatePath("/admin/envios");
}

export async function deleteShippingZone(id: string) {
  await prisma.shippingZone.delete({ where: { id } });
  revalidatePath("/admin/envios");
}

// ─── Shipping Rates ────────────────────────────────────────────────────────────

export type RateInput = {
  name: string;
  price: number;
  freeAboveOrder?: number | null;
  estimatedDays?: string | null;
  zoneId: string;
};

export async function createShippingRate(data: RateInput) {
  await prisma.shippingRate.create({
    data: {
      name: data.name,
      price: data.price,
      freeAboveOrder: data.freeAboveOrder ?? null,
      estimatedDays: data.estimatedDays ?? null,
      zoneId: data.zoneId,
    },
  });
  revalidatePath("/admin/envios");
}

export async function updateShippingRate(id: string, data: Partial<RateInput>) {
  await prisma.shippingRate.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.freeAboveOrder !== undefined ? { freeAboveOrder: data.freeAboveOrder } : {}),
      ...(data.estimatedDays !== undefined ? { estimatedDays: data.estimatedDays } : {}),
    },
  });
  revalidatePath("/admin/envios");
}

export async function deleteShippingRate(id: string) {
  await prisma.shippingRate.delete({ where: { id } });
  revalidatePath("/admin/envios");
}

// ─── Seed defaults ─────────────────────────────────────────────────────────────

export async function seedDefaultZones() {
  const existing = await prisma.shippingZone.count();
  if (existing > 0) return { skipped: true };

  const zones = [
    {
      name: "CABA",
      provinces: ["Ciudad Autónoma de Buenos Aires"],
      rates: [
        { name: "Estándar (1-2 días)", price: 1200, freeAboveOrder: 50000, estimatedDays: "1-2 días hábiles" },
        { name: "Express (24hs)", price: 1900, estimatedDays: "24hs" },
      ],
    },
    {
      name: "Gran Buenos Aires",
      provinces: ["Buenos Aires (GBA)"],
      rates: [
        { name: "Estándar (1-3 días)", price: 1500, freeAboveOrder: 60000, estimatedDays: "1-3 días hábiles" },
        { name: "Express (24hs)", price: 2300, estimatedDays: "24hs" },
      ],
    },
    {
      name: "Buenos Aires Interior",
      provinces: ["Buenos Aires"],
      rates: [
        { name: "Estándar (3-5 días)", price: 2200, freeAboveOrder: 80000, estimatedDays: "3-5 días hábiles" },
        { name: "Express (48hs)", price: 3400, estimatedDays: "48hs" },
      ],
    },
    {
      name: "Córdoba / Santa Fe",
      provinces: ["Córdoba", "Santa Fe"],
      rates: [
        { name: "Estándar (3-5 días)", price: 2400, freeAboveOrder: 80000, estimatedDays: "3-5 días hábiles" },
        { name: "Express (48hs)", price: 3600, estimatedDays: "48hs" },
      ],
    },
    {
      name: "Interior del país",
      provinces: ["Mendoza", "Tucumán", "Entre Ríos", "Salta", "Jujuy", "San Luis", "San Juan", "La Rioja", "Catamarca", "Santiago del Estero", "Corrientes", "Misiones", "Chaco", "Formosa", "La Pampa"],
      rates: [
        { name: "Estándar (5-7 días)", price: 3200, estimatedDays: "5-7 días hábiles" },
      ],
    },
    {
      name: "Patagonia",
      provinces: ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"],
      rates: [
        { name: "Estándar (7-10 días)", price: 3900, estimatedDays: "7-10 días hábiles" },
      ],
    },
  ];

  for (const z of zones) {
    const zone = await prisma.shippingZone.create({
      data: { name: z.name, provinces: z.provinces, active: true },
    });
    for (const r of z.rates) {
      await prisma.shippingRate.create({
        data: { ...r, zoneId: zone.id },
      });
    }
  }

  revalidatePath("/admin/envios");
  return { skipped: false, created: zones.length };
}
