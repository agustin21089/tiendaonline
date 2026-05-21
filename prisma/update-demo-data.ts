import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

// Picsum photos with fixed seeds → consistent images each run
const productImages: Record<string, { url: string; alt: string }[]> = {
  "almohadon-lino-natural": [
    { url: "https://picsum.photos/seed/linen-cushion/800/800", alt: "Almohadón lino natural" },
    { url: "https://picsum.photos/seed/linen-detail/800/800", alt: "Detalle almohadón" },
  ],
  "jarron-ceramico-arena": [
    { url: "https://picsum.photos/seed/ceramic-vase/800/800", alt: "Jarrón cerámico arena" },
  ],
  "set-jarrones-terracota": [
    { url: "https://picsum.photos/seed/terracotta-set/800/800", alt: "Set jarrones terracota" },
    { url: "https://picsum.photos/seed/terracotta-detail/800/800", alt: "Detalle terracota" },
  ],
  "cuadro-abstracto-beige": [
    { url: "https://picsum.photos/seed/abstract-art/800/800", alt: "Cuadro abstracto beige" },
  ],
  "vela-soja-lavanda": [
    { url: "https://picsum.photos/seed/soy-candle/800/800", alt: "Vela de soja lavanda" },
  ],
  "almohadon-terciopelo-tostado": [
    { url: "https://picsum.photos/seed/velvet-cushion/800/800", alt: "Almohadón terciopelo tostado" },
  ],
};

const categoryImages: Record<string, string> = {
  living: "https://picsum.photos/seed/living-room/600/600",
  dormitorio: "https://picsum.photos/seed/bedroom-deco/600/600",
  cocina: "https://picsum.photos/seed/kitchen-deco/600/600",
  exterior: "https://picsum.photos/seed/outdoor-deco/600/600",
};

async function main() {
  // 1. Update site settings
  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: {
      storeName: "Arena Deco House",
      metaTitle: "Arena Deco House — Decoración del hogar",
      metaDescription: "Tu tienda de decoración con estilo. Jarrones, almohadones, cuadros y más.",
    },
  });
  console.log("✅ Nombre de la tienda actualizado a 'Arena Deco House'");

  // 2. Add images to products
  for (const [slug, images] of Object.entries(productImages)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`⚠ Producto no encontrado: ${slug}`);
      continue;
    }

    const existing = await prisma.productImage.count({ where: { productId: product.id } });
    if (existing > 0) {
      console.log(`⏭ ${slug} ya tiene imágenes`);
      continue;
    }

    await prisma.productImage.createMany({
      data: images.map((img, i) => ({
        productId: product.id,
        url: img.url,
        alt: img.alt,
        order: i,
      })),
    });
    console.log(`✅ Imágenes agregadas a: ${slug}`);
  }

  // 3. Update category images
  for (const [slug, imageUrl] of Object.entries(categoryImages)) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      console.log(`⚠ Categoría no encontrada: ${slug}`);
      continue;
    }
    await prisma.category.update({
      where: { slug },
      data: { image: imageUrl },
    });
    console.log(`✅ Imagen de categoría actualizada: ${slug}`);
  }

  console.log("\n✨ ¡Datos actualizados!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
