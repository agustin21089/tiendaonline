"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { register, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300";
const labelClass = "block text-sm font-medium text-warm-700 mb-1";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creando cuenta...</>
      ) : (
        "Crear cuenta"
      )}
    </Button>
  );
}

export default function RegistroPage() {
  const router = useRouter();
  const [state, formAction] = useActionState<RegisterState, FormData>(register, {});

  useEffect(() => {
    if (state.success && state.email) {
      router.push(`/verificar?email=${encodeURIComponent(state.email)}`);
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  return (
    <div className="min-h-screen bg-arena-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-arena-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Crear cuenta</h1>
          <p className="text-sm text-warm-500 mt-1">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-arena-600 hover:underline font-medium">
              Ingresá acá
            </Link>
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/cuenta" })}
          className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-arena-200 bg-white text-sm font-medium text-warm-700 hover:bg-arena-50 transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Registrarse con Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-arena-200" />
          <span className="text-xs text-warm-400">o completá el formulario</span>
          <div className="flex-1 border-t border-arena-200" />
        </div>

        <form action={formAction} className="bg-white rounded-2xl border border-arena-200 shadow-sm p-6 space-y-5">
          {/* Datos de acceso */}
          <div>
            <h2 className="text-sm font-semibold text-warm-800 mb-3">Datos de acceso</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nombre completo *</label>
                <input type="text" name="name" required className={inputClass} placeholder="Juan García" />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" name="email" required className={inputClass} placeholder="juan@ejemplo.com" />
              </div>
              <div>
                <label className={labelClass}>Contraseña *</label>
                <input type="password" name="password" required minLength={6} className={inputClass} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
          </div>

          {/* Datos personales */}
          <div>
            <h2 className="text-sm font-semibold text-warm-800 mb-3">Datos personales</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Teléfono</label>
                <input type="tel" name="phone" className={inputClass} placeholder="+54 11 1234-5678" />
              </div>
              <div>
                <label className={labelClass}>DNI</label>
                <input type="text" name="dni" className={inputClass} placeholder="12.345.678" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Fecha de nacimiento</label>
                <input type="date" name="birthDate" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h2 className="text-sm font-semibold text-warm-800 mb-3">Dirección <span className="text-warm-400 font-normal">(opcional)</span></h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Calle y número</label>
                <input type="text" name="address" className={inputClass} placeholder="Av. Corrientes 1234" />
              </div>
              <div>
                <label className={labelClass}>Ciudad</label>
                <input type="text" name="city" className={inputClass} placeholder="Buenos Aires" />
              </div>
              <div>
                <label className={labelClass}>Provincia</label>
                <input type="text" name="state" className={inputClass} placeholder="Buenos Aires" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Código postal</label>
                <input type="text" name="zip" className={inputClass} placeholder="1043" />
              </div>
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
