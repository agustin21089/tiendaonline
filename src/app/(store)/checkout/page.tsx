import { CheckoutForm } from "./checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-light text-warm-900 mb-8">
        Finalizar compra
      </h1>
      <CheckoutForm />
    </div>
  );
}
