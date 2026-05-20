import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const password = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tienda.com" },
    update: {},
    create: {
      email: "admin@tienda.com",
      name: "Administrador",
      password,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.email);

  // Categorías raíz
  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { slug: "living" },
      update: {},
      create: { name: "Living", slug: "living", order: 1, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "dormitorio" },
      update: {},
      create: { name: "Dormitorio", slug: "dormitorio", order: 2, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "cocina" },
      update: {},
      create: { name: "Cocina", slug: "cocina", order: 3, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "exterior" },
      update: {},
      create: { name: "Exterior", slug: "exterior", order: 4, active: true },
    }),
  ]);
  console.log("✅ Categorías raíz creadas");

  // Subcategorías
  const subCategorias = await Promise.all([
    prisma.category.upsert({
      where: { slug: "almohadones" },
      update: {},
      create: { name: "Almohadones", slug: "almohadones", parentId: categorias[0].id, order: 1, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "jarrones" },
      update: {},
      create: { name: "Jarrones & Floreros", slug: "jarrones", parentId: categorias[0].id, order: 2, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "cuadros" },
      update: {},
      create: { name: "Cuadros", slug: "cuadros", parentId: categorias[0].id, order: 3, active: true },
    }),
    prisma.category.upsert({
      where: { slug: "velas" },
      update: {},
      create: { name: "Velas & Difusores", slug: "velas", parentId: categorias[1].id, order: 1, active: true },
    }),
  ]);
  console.log("✅ Subcategorías creadas");

  // Productos de ejemplo
  const productos = [
    {
      name: "Almohadón lino natural",
      slug: "almohadon-lino-natural",
      description: "Almohadón artesanal en lino natural, con relleno de pluma. Ideal para dar calidez a tu living.",
      price: 18500,
      comparePrice: 22000,
      stock: 12,
      featured: true,
      categoryId: subCategorias[0].id,
    },
    {
      name: "Jarrón cerámico arena",
      slug: "jarron-ceramico-arena",
      description: "Jarrón en cerámica artesanal, terminación mate color arena. Perfecto para flores secas.",
      price: 12900,
      stock: 8,
      featured: true,
      categoryId: subCategorias[1].id,
    },
    {
      name: "Set de 3 jarrones terracota",
      slug: "set-jarrones-terracota",
      description: "Set de tres jarrones en terracota con distintas alturas. Combinan perfecto en cualquier ambiente.",
      price: 28000,
      comparePrice: 35000,
      stock: 5,
      featured: true,
      categoryId: subCategorias[1].id,
    },
    {
      name: "Cuadro abstracto beige",
      slug: "cuadro-abstracto-beige",
      description: "Impresión en papel de algodón de 300g, con bastidor de madera de 60x80cm.",
      price: 35000,
      stock: 3,
      featured: false,
      categoryId: subCategorias[2].id,
    },
    {
      name: "Vela de soja aroma lavanda",
      slug: "vela-soja-lavanda",
      description: "Vela artesanal de cera de soja con aroma a lavanda. Pote de vidrio reutilizable. 40hs de duración.",
      price: 8900,
      stock: 20,
      featured: true,
      categoryId: subCategorias[3].id,
    },
    {
      name: "Almohadón terciopelo tostado",
      slug: "almohadon-terciopelo-tostado",
      description: "Almohadón en terciopelo color tostado, 50x50cm con cierre invisible.",
      price: 14500,
      stock: 15,
      featured: false,
      categoryId: subCategorias[0].id,
    },
  ];

  for (const p of productos) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        active: true,
        trackStock: true,
        sku: p.slug.toUpperCase(),
        price: p.price,
        comparePrice: (p as { comparePrice?: number }).comparePrice ?? null,
      },
    });
  }
  console.log("✅ Productos de ejemplo creados");

  // Settings del sitio
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "Merlina Home Deco",
      email: "hola@merlinahome.com.ar",
      whatsapp: "5491123456789",
      instagram: "merlinahome",
      freeShippingMin: 50000,
      metaTitle: "Merlina Home Deco — Decoración del hogar",
      metaDescription: "Tu tienda de decoración con estilo. Jarrones, almohadones, cuadros y más.",
    },
  });
  console.log("✅ Configuración del sitio guardada");

  console.log("\n🎉 ¡Listo! Podés ingresar con:");
  console.log("   Email:      admin@tienda.com");
  console.log("   Contraseña: admin123");
  console.log("   URL:        http://localhost:3000/admin\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
