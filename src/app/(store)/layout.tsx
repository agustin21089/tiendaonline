import { CartProvider } from "@/context/cart-context";
import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { GoogleOneTap } from "@/components/store/google-one-tap";
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
  const logoUrl = settings?.logo ?? null;

  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? null;

  return (
    <CartProvider>
      {googleClientId && <GoogleOneTap clientId={googleClientId} />}
      <StoreHeader storeName={storeName} categories={categories} logoUrl={logoUrl} />
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
