import { CheckoutForm } from "./checkout-form";
import { CheckoutLoginGate } from "@/components/store/checkout-login-gate";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
};

interface Props {
  searchParams: Promise<{ guest?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [session, { guest }] = await Promise.all([auth(), searchParams]);

  // Show login gate if not authenticated and not in guest mode
  if (!session?.user && guest !== "1") {
    return <CheckoutLoginGate />;
  }

  let defaultValues: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, address: true, city: true, state: true, zip: true },
    });
    if (user) defaultValues = {
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      address: user.address ?? undefined,
      city: user.city ?? undefined,
      state: user.state ?? undefined,
      zip: user.zip ?? undefined,
    };
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-light text-warm-900 mb-8">
        Finalizar compra
      </h1>
      <CheckoutForm defaultValues={defaultValues} />
    </div>
  );
}
