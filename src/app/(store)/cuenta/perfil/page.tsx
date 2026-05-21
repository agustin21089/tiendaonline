"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useSession } from "next-auth/react";
import { updateProfile, type ProfileState } from "../actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300 disabled:bg-arena-50 disabled:text-warm-400";
const labelClass = "block text-sm font-medium text-warm-700 mb-1";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Guardar cambios"}
    </Button>
  );
}

type ExtendedUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string | null;
  dni?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const user = session?.user as ExtendedUser | undefined;
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, {});

  // Use a ref to track which state object we already handled.
  // This prevents the effect from re-firing when `update` (a new function
  // reference each render) changes, which would cause infinite toasts.
  const handledState = useRef<ProfileState | null>(null);

  useEffect(() => {
    if (state === handledState.current) return; // already handled this state
    handledState.current = state;

    if (state.success) {
      toast.success("Perfil actualizado");
      update(); // refresh session so the header/avatar picks up new name
    }
    if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-warm-900">Mi perfil</h1>
        <p className="text-sm text-warm-500 mt-0.5">Actualizá tus datos personales</p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Datos de cuenta */}
        <section className="bg-white rounded-2xl border border-arena-200 p-6">
          <h2 className="text-sm font-semibold text-warm-800 mb-4">Datos de cuenta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nombre completo</label>
              <input type="text" name="name" defaultValue={user?.name ?? ""} className={inputClass} placeholder="Juan García" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <input type="email" value={user?.email ?? ""} disabled className={inputClass} />
              <p className="text-xs text-warm-400 mt-1">El email no se puede cambiar.</p>
            </div>
          </div>
        </section>

        {/* Datos personales */}
        <section className="bg-white rounded-2xl border border-arena-200 p-6">
          <h2 className="text-sm font-semibold text-warm-800 mb-4">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="tel" name="phone" defaultValue={user?.phone ?? ""} className={inputClass} placeholder="+54 11 1234-5678" />
            </div>
            <div>
              <label className={labelClass}>DNI</label>
              <input type="text" name="dni" defaultValue={user?.dni ?? ""} className={inputClass} placeholder="12.345.678" />
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input
                type="date"
                name="birthDate"
                defaultValue={user?.birthDate ? new Date(user.birthDate).toISOString().slice(0, 10) : ""}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Dirección */}
        <section className="bg-white rounded-2xl border border-arena-200 p-6">
          <h2 className="text-sm font-semibold text-warm-800 mb-4">Dirección de envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Calle y número</label>
              <input type="text" name="address" defaultValue={user?.address ?? ""} className={inputClass} placeholder="Av. Corrientes 1234, Piso 3" />
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <input type="text" name="city" defaultValue={user?.city ?? ""} className={inputClass} placeholder="Buenos Aires" />
            </div>
            <div>
              <label className={labelClass}>Provincia</label>
              <input type="text" name="state" defaultValue={user?.state ?? ""} className={inputClass} placeholder="Buenos Aires" />
            </div>
            <div>
              <label className={labelClass}>Código postal</label>
              <input type="text" name="zip" defaultValue={user?.zip ?? ""} className={inputClass} placeholder="1043" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
