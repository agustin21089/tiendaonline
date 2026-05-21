"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { SiteSettings } from "@/generated/prisma/client";

// Serialised version safe to pass from Server → Client Component.
// `freeShippingMin` is converted from Prisma Decimal to plain number | null.
type SerializedSettings = Omit<SiteSettings, "freeShippingMin"> & {
  freeShippingMin: number | null;
};
import { DEFAULT_ORDER_TEMPLATE, DEFAULT_VERIFY_TEMPLATE } from "@/lib/email-templates";
import { AppearanceSection } from "./appearance-section";

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

/** Replace {{variable}} placeholders with sample values for preview */
function renderPreview(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `<span style="background:#fef3c7;padding:0 2px">{{${key}}}</span>`);
}

const ORDER_SAMPLE = { name: "María García", orderNumber: "1042", total: "$ 84.500" };
const VERIFY_SAMPLE = { name: "María García", code: "847291" };

function TemplateEditor({
  name,
  label,
  defaultValue,
  fallback,
  variables,
  sampleVars,
}: {
  name: string;
  label: string;
  defaultValue: string | null | undefined;
  fallback: string;
  variables: string[];
  sampleVars: Record<string, string>;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState(false);

  const html = value || fallback;
  const previewHtml = renderPreview(html, sampleVars);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelClass}>{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setValue("")}
            title="Restaurar plantilla por defecto"
            className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Restaurar
          </button>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="flex items-center gap-1 text-xs text-arena-600 hover:text-arena-800 transition-colors"
          >
            {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {preview ? "Editar" : "Vista previa"}
          </button>
        </div>
      </div>

      {/* Variable reference chips */}
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v) => (
          <code
            key={v}
            className="text-xs bg-arena-50 border border-arena-200 text-arena-700 rounded px-1.5 py-0.5 font-mono cursor-pointer hover:bg-arena-100 select-all"
            title="Hacé clic para copiar"
            onClick={() => navigator.clipboard?.writeText(`{{${v}}}`).catch(() => {})}
          >
            {`{{${v}}}`}
          </code>
        ))}
        <span className="text-xs text-warm-400 self-center ml-1">Hacé clic para copiar</span>
      </div>

      {preview ? (
        <iframe
          srcDoc={previewHtml}
          className="w-full border border-arena-200 rounded-lg bg-white"
          style={{ height: 260 }}
          sandbox="allow-same-origin"
          title={`Vista previa ${label}`}
        />
      ) : (
        <textarea
          name={name}
          rows={8}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={fallback}
          className="w-full px-3 py-2 rounded-lg border border-arena-200 text-xs text-warm-900 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 resize-y font-mono placeholder:text-warm-300"
        />
      )}
      <p className="text-xs text-warm-400">
        Dejá vacío para usar la plantilla predeterminada. Usá HTML libre con los <code className="font-mono">{"{{variables}}"}</code> indicadas.
      </p>
    </div>
  );
}

export function SettingsForm({
  settings,
  action,
}: {
  settings: SerializedSettings | null;
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

      {/* Apariencia */}
      <AppearanceSection
        primaryColor={settings?.primaryColor ?? "#B07D45"}
        neutralColor={settings?.neutralColor ?? "#787868"}
        darkMode={settings?.darkMode ?? false}
        logo={settings?.logo}
        logoPublicId={settings?.logoPublicId}
      />

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

      {/* Notificaciones */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-warm-800">Notificaciones al administrador</h2>
        <div>
          <label className={labelClass}>WhatsApp admin (número E.164 sin +)</label>
          <input
            type="text"
            name="adminWhatsapp"
            defaultValue={settings?.adminWhatsapp ?? ""}
            className={inputClass}
            placeholder="5491112345678"
          />
          <p className="text-xs text-warm-400 mt-1">
            Si está configurado Twilio, recibirás un WhatsApp por cada nueva orden. Formato: código de país + número sin espacios.
          </p>
        </div>
      </section>

      {/* Email templates */}
      <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-6">
        <div>
          <h2 className="font-display text-base font-semibold text-warm-800">Plantillas de email</h2>
          <p className="text-xs text-warm-500 mt-0.5">
            Personalizá los correos que reciben tus clientes. Usá HTML libre o dejá vacío para la plantilla predeterminada.
          </p>
        </div>

        <TemplateEditor
          name="emailOrderTemplate"
          label="Confirmación de orden"
          defaultValue={settings?.emailOrderTemplate}
          fallback={DEFAULT_ORDER_TEMPLATE}
          variables={["name", "orderNumber", "total"]}
          sampleVars={ORDER_SAMPLE}
        />

        <hr className="border-arena-100" />

        <TemplateEditor
          name="emailVerifyTemplate"
          label="Verificación de cuenta"
          defaultValue={settings?.emailVerifyTemplate}
          fallback={DEFAULT_VERIFY_TEMPLATE}
          variables={["name", "code"]}
          sampleVars={VERIFY_SAMPLE}
        />
      </section>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
