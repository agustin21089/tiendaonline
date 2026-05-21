"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
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

export type ProfileInitialData = {
  name: string;
  email: string;
  phone: string;
  dni: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export function ProfileForm({ initialData }: { initialData: ProfileInitialData }) {
  // Controlled form state — values come from DB (not JWT), so they're always populated
  const [fields, setFields] = useState<ProfileInitialData>(initialData);

  // When the server re-renders with fresh DB data (e.g. after save + router.refresh),
  // sync the form. Using a ref to avoid syncing on every render.
  const prevInitial = useRef(initialData);
  useEffect(() => {
    if (prevInitial.current !== initialData) {
      prevInitial.current = initialData;
      setFields(initialData);
    }
  }, [initialData]);

  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, {});

  // Guard: track which state object we already processed to prevent
  // running this effect multiple times for the same result.
  const handledState = useRef<ProfileState | null>(null);

  useEffect(() => {
    if (state === handledState.current) return;
    handledState.current = state;

    if (state.success) {
      toast.success("Perfil actualizado");
      // NOTE: do NOT call update() or router.refresh() here.
      // update() triggers router.refresh() internally in NextAuth v5 App Router,
      // which remounts this component and causes the toast loop.
      // The DB was already updated; the user sees the values they typed (controlled inputs).
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function set(field: keyof ProfileInitialData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Datos de cuenta */}
      <section className="bg-white rounded-2xl border border-arena-200 p-6">
        <h2 className="text-sm font-semibold text-warm-800 mb-4">Datos de cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nombre completo</label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={set("name")}
              className={inputClass}
              placeholder="Juan García"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={fields.email}
              disabled
              className={inputClass}
            />
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
            <input
              type="tel"
              name="phone"
              value={fields.phone}
              onChange={set("phone")}
              className={inputClass}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label className={labelClass}>DNI</label>
            <input
              type="text"
              name="dni"
              value={fields.dni}
              onChange={set("dni")}
              className={inputClass}
              placeholder="12.345.678"
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input
              type="date"
              name="birthDate"
              value={fields.birthDate}
              onChange={set("birthDate")}
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
            <input
              type="text"
              name="address"
              value={fields.address}
              onChange={set("address")}
              className={inputClass}
              placeholder="Av. Corrientes 1234, Piso 3"
            />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              type="text"
              name="city"
              value={fields.city}
              onChange={set("city")}
              className={inputClass}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label className={labelClass}>Provincia</label>
            <input
              type="text"
              name="state"
              value={fields.state}
              onChange={set("state")}
              className={inputClass}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label className={labelClass}>Código postal</label>
            <input
              type="text"
              name="zip"
              value={fields.zip}
              onChange={set("zip")}
              className={inputClass}
              placeholder="1043"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
