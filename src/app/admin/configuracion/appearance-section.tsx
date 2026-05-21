"use client";

import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, RotateCcw, Moon, Sun, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { generateScale, COLOR_PRESETS } from "@/lib/theme";
import { toast } from "sonner";

// ─── Color scale preview strip ────────────────────────────────────────────────

function ScalePreview({ hex }: { hex: string }) {
  let scale: Record<string, string> = {};
  try { scale = generateScale(hex); } catch { return null; }
  const weights = ["50","100","200","300","400","500","600","700","800","900"];
  return (
    <div className="flex rounded-lg overflow-hidden h-6 w-full">
      {weights.map((w) => (
        <div key={w} style={{ background: scale[w], flex: 1 }} title={`${w}: ${scale[w]}`} />
      ))}
    </div>
  );
}

// ─── Color picker row ─────────────────────────────────────────────────────────

function ColorPicker({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue || "#B07D45");
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-warm-700">{label}</label>

      <div className="flex items-center gap-3">
        {/* Native color picker */}
        <label className="relative cursor-pointer">
          <span
            className="w-10 h-10 rounded-lg border-2 border-arena-200 block shadow-inner"
            style={{ background: isValid ? value : "#ccc" }}
          />
          <input
            type="color"
            value={isValid ? value : "#000000"}
            onChange={(e) => setValue(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        {/* Hex text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={7}
          placeholder="#B07D45"
          className={`w-28 h-10 px-3 rounded-lg border text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 uppercase ${
            isValid ? "border-arena-200 text-warm-900" : "border-red-300 text-red-600"
          }`}
        />

        <span className="text-xs text-warm-400">{isValid ? "✓ válido" : "Hex inválido"}</span>
      </div>

      {isValid && <ScalePreview hex={value} />}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={isValid ? value : defaultValue} />
    </div>
  );
}

// ─── Preset palette chips ─────────────────────────────────────────────────────

function PresetPalettes({
  onSelect,
}: {
  onSelect: (primary: string, neutral: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-warm-600 uppercase tracking-wide">Paletas predefinidas</p>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            title={preset.name}
            onClick={() => {
              setSelected(preset.name);
              onSelect(preset.primary, preset.neutral);
            }}
            className={`relative flex items-center gap-1.5 pl-1.5 pr-3 h-8 rounded-full border text-xs font-medium transition-all ${
              selected === preset.name
                ? "border-arena-500 shadow-sm"
                : "border-arena-200 hover:border-arena-400"
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-white/50 shadow-sm" style={{ background: preset.primary }} />
            <span className="text-warm-700">{preset.name}</span>
            {selected === preset.name && <Check className="w-3 h-3 text-arena-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Logo uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  defaultLogo,
  defaultLogoPublicId,
}: {
  defaultLogo: string | null | undefined;
  defaultLogoPublicId: string | null | undefined;
}) {
  const [url, setUrl] = useState(defaultLogo ?? "");
  const [publicId, setPublicId] = useState(defaultLogoPublicId ?? "");
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"preview" | "url">(defaultLogo ? "preview" : "url");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al subir imagen");
        return;
      }
      setUrl(json.url);
      setPublicId(json.publicId ?? "");
      setMode("preview");
      toast.success("Logo subido");
    } catch {
      toast.error("Error de red al subir logo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-warm-700">Logotipo</label>

      <div className="flex gap-3 items-start">
        {/* Preview box */}
        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-arena-200 flex items-center justify-center bg-arena-50 shrink-0 overflow-hidden">
          {url ? (
            <Image src={url} alt="Logo" width={96} height={96} className="object-contain p-1" unoptimized />
          ) : (
            <span className="text-xs text-warm-400 text-center px-2">Sin logo</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* Upload button */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-arena-200 text-sm text-warm-700 hover:bg-arena-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Subiendo…" : "Subir archivo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* URL input */}
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setMode("preview"); }}
              placeholder="https://…/logo.png"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-arena-200 text-xs text-warm-800 bg-white focus:outline-none focus:ring-2 focus:ring-arena-400"
            />
          </div>

          {url && (
            <button
              type="button"
              onClick={() => { setUrl(""); setPublicId(""); }}
              className="flex items-center gap-1 text-xs text-warm-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Eliminar logo
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-warm-400">PNG con fondo transparente recomendado · Máx. 2 MB</p>

      {/* Hidden inputs */}
      <input type="hidden" name="logo" value={url} />
      <input type="hidden" name="logoPublicId" value={publicId} />
    </div>
  );
}

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

function DarkModeToggle({ defaultValue }: { defaultValue: boolean }) {
  const [dark, setDark] = useState(defaultValue);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-warm-700">Modo oscuro</p>
        <p className="text-xs text-warm-400 mt-0.5">Invierte la paleta para un look nocturno</p>
      </div>
      <div className="flex items-center gap-3">
        <Sun className={`w-4 h-4 transition-colors ${dark ? "text-warm-300" : "text-arena-500"}`} />
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={() => setDark((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-arena-400 focus:ring-offset-1 ${
            dark ? "bg-arena-600" : "bg-warm-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              dark ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <Moon className={`w-4 h-4 transition-colors ${dark ? "text-arena-400" : "text-warm-300"}`} />
      </div>
      <input type="hidden" name="darkMode" value={dark ? "true" : "false"} />
    </div>
  );
}

// ─── Full appearance section ──────────────────────────────────────────────────

interface AppearanceSectionProps {
  primaryColor: string;
  neutralColor: string;
  darkMode: boolean;
  logo: string | null | undefined;
  logoPublicId: string | null | undefined;
}

export function AppearanceSection({
  primaryColor,
  neutralColor,
  darkMode,
  logo,
  logoPublicId,
}: AppearanceSectionProps) {
  const [primary, setPrimary] = useState(primaryColor || "#B07D45");
  const [neutral, setNeutral] = useState(neutralColor || "#787868");
  // Incrementing key forces ColorPicker to remount with new defaultValues when a preset is picked
  const [presetKey, setPresetKey] = useState(0);

  function handlePreset(p: string, n: string) {
    setPrimary(p);
    setNeutral(n);
    setPresetKey((k) => k + 1);
  }

  return (
    <section className="bg-white rounded-xl border border-arena-200 p-6 space-y-6">
      <div>
        <h2 className="font-display text-base font-semibold text-warm-800">Apariencia</h2>
        <p className="text-xs text-warm-500 mt-0.5">
          Personalizá la paleta de colores y el aspecto visual de tu tienda
        </p>
      </div>

      {/* Logo */}
      <LogoUploader defaultLogo={logo} defaultLogoPublicId={logoPublicId} />

      <hr className="border-arena-100" />

      {/* Color presets */}
      <PresetPalettes onSelect={handlePreset} />

      {/* Color pickers — key forces remount when preset changes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" key={presetKey}>
        <ColorPicker
          label="Color principal (marca)"
          name="primaryColor"
          defaultValue={primary}
        />
        <ColorPicker
          label="Color neutro (textos/bordes)"
          name="neutralColor"
          defaultValue={neutral}
        />
      </div>

      <hr className="border-arena-100" />

      {/* Dark mode */}
      <DarkModeToggle defaultValue={darkMode} />
    </section>
  );
}
