import { prisma } from "@/lib/prisma";
import { ShippingClient } from "./shipping-client";

export const metadata = { title: "Envíos — Admin" };

export default async function EnviosPage() {
  const zones = await prisma.shippingZone.findMany({
    include: {
      rates: { orderBy: { price: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const serialized = zones.map((z) => ({
    id: z.id,
    name: z.name,
    provinces: z.provinces,
    active: z.active,
    rates: z.rates.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      freeAboveOrder: r.freeAboveOrder ? Number(r.freeAboveOrder) : null,
      estimatedDays: r.estimatedDays,
    })),
  }));

  return <ShippingClient zones={serialized} />;
}
