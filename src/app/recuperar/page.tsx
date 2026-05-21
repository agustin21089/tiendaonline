"use client";

import { useState } from "react";
import { forgotPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RecuperarPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-arena-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-warm-900 mb-2">
            Revisá tu email
          </h1>
          <p className="text-warm-500 text-sm mb-6">
            Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.
            Expira en 1 hora.
          </p>
          <Link href="/login" className="text-arena-600 hover:underline text-sm font-medium">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-arena-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-warm-500 mt-1">
            Ingresá tu email y te enviamos un enlace
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-arena-200 shadow-sm p-6 space-y-4"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="juan@ejemplo.com"
          />
          <Button type="submit" loading={loading} className="w-full">
            Enviar enlace
          </Button>
          <p className="text-center text-sm text-warm-400">
            <Link href="/login" className="hover:underline text-arena-600">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
