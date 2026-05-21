"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { SiteSettings } from "@/generated/prisma/client";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Guardar cambios"}
    </Button>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 placeholder:text-warm-300";

const labelClass = "block text-sm font-medium text-warm-700 mb-1";

type Action = (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;

export function SettingsForm({
  settings,
  action,
}: {
  settings: SiteSettings | null;
  action: Action;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Identidad */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-warm-800">Identidad</h2>
        <div>
          <label className={labelClass}>Nombre de la tienda *</label>
          <input
            type="text"
            name="storeName"
            required
            defaultValue={settings?.storeName ?? ""}
            className={inputClass}
            placeholder="Arena Deco House"
          />
        </div>
        <div>
          <label className={labelClass}>Título SEO</label>
          <input
            type="text"
            name="metaTitle"
            defaultValue={settings?.metaTitle ?? ""}
            className={inputClass}
            placeholder="Arena Deco House — Decoración del hogar"
          />
        </div>
        <div>
          <label className={labelClass}>Descripción SEO</label>
          <textarea
            name="metaDescription"
            rows={2}
            defaultValue={settings?.metaDescription ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-arena-200 text-sm text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 resize-none placeholder:text-warm-300"
            placeholder="Tu tienda de decoración con estilo..."
          />
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-warm-800">Contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="email"
              defaultValue={settings?.email ?? ""}
              className={inputClass}
              placeholder="hola@tienda.com"
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="text"
              name="phone"
              defaultValue={settings?.phone ?? ""}
              className={inputClass}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              name="address"
              defaultValue={settings?.address ?? ""}
              className={inputClass}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>
        </div>
      </section>

      {/* Redes */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-warm-800">Redes sociales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Instagram (usuario)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400">@</span>
              <input
                type="text"
                name="instagram"
                defaultValue={settings?.instagram ?? ""}
                className={`${inputClass} pl-7`}
                placeholder="arenadeco"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Facebook (usuario)</label>
            <input
              type="text"
              name="facebook"
              defaultValue={settings?.facebook ?? ""}
              className={inputClass}
              placeholder="arenadeco"
            />
          </div>
          <div>
            <label className={labelClass}>WhatsApp (número)</label>
            <input
              type="text"
              name="whatsapp"
              defaultValue={settings?.whatsapp ?? ""}
              className={inputClass}
              placeholder="5491123456789"
            />
          </div>
        </div>
      </section>

      {/* Envíos */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-warm-800">Envíos</h2>
        <div>
          <label className={labelClass}>Monto mínimo para envío gratis ($)</label>
          <input
            type="number"
            name="freeShippingMin"
            min={0}
            step={1000}
            defaultValue={settings?.freeShippingMin ? Number(settings.freeShippingMin) : ""}
            className={inputClass}
            placeholder="50000"
          />
          <p className="text-xs text-warm-400 mt-1">Dejá vacío para no mostrar envío gratis</p>
        </div>
      </section>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
