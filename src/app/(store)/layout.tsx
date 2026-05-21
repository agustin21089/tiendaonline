import { CartProvider } from "@/context/cart-context";
import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { prisma } from "@/lib/prisma";

async function getSiteData() {
  const [settings, categories] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.category.findMany({
      where: { active: true, parentId: null },
      orderBy: { order: "asc" },
      select: { name: true, slug: true },
    }),
  ]);
  return { settings, categories };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getSiteData();
  const storeName = settings?.storeName ?? "Mi Tienda";

  return (
    <CartProvider>
      <StoreHeader storeName={storeName} categories={categories} />
      <main className="flex-1">{children}</main>
      <StoreFooter
        storeName={storeName}
        instagram={settings?.instagram}
        facebook={settings?.facebook}
        whatsapp={settings?.whatsapp}
        email={settings?.email}
      />
    </CartProvider>
  );
}
