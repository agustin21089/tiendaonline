/**
 * Run with: npx tsx prisma/seed-banners.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  await prisma.banner.deleteMany({});

  const banners = [
    {
      title: "Decorá tu hogar con amor",
      subtitle: "Nueva colección otoño 2025 — Texturas naturales para cada ambiente",
      image: "https://picsum.photos/seed/luxury-living-room/1600/700",
      link: "/categoria/living",
      order: 1,
    },
    {
      title: "Dormitorio — Tu refugio",
      subtitle: "Ropa de cama premium y diseño nórdico para descansar mejor",
      image: "https://picsum.photos/seed/cozy-bedroom/1600/700",
      link: "/categoria/dormitorio",
      order: 2,
    },
    {
      title: "Jardín al aire libre",
      subtitle: "Muebles de teca, mesas y deco para vivir afuera",
      image: "https://picsum.photos/seed/garden-terrace/1600/700",
      link: "/categoria/exterior",
      order: 3,
    },
  ];

  for (const b of banners) {
    await prisma.banner.create({ data: { ...b, active: true, position: "HOME_HERO" } });
  }
  console.log("✓ Banners creados:", banners.length);

  // Mark featured products
  const featuredSlugs = [
    "sofa-oslo-3-cuerpos", "sillon-bergere-tapizado", "mesa-ratona-marmol",
    "alfombra-kilim-tejida", "cama-sommier-queen-160", "funda-nordica-lino",
    "set-vajilla-ceramica-12", "mesa-jardin-teca-6p", "guirnalda-luces-exterior",
    "espejo-redondo-dorado",
  ];
  const r = await prisma.product.updateMany({
    where: { slug: { in: featuredSlugs } },
    data: { featured: true },
  });
  console.log("✓ Productos destacados:", r.count);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
