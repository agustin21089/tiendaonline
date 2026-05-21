/**
 * Dynamic theme engine.
 *
 * Takes two hex colors (primary brand + neutral) from SiteSettings and
 * generates a full 10-step CSS color scale that overrides the Tailwind v4
 * @theme variables at runtime via an injected <style> tag.
 *
 * The scale strategy:
 *   50–400  → lerp toward white  (preserve hue, reduce saturation gently)
 *   500     → the chosen base color exactly
 *   600–900 → lerp toward black  (preserve hue, increase saturation slightly)
 *
 * Dark mode: inverts the scale weights (50↔900, 100↔800, …) and
 *   overrides body/surface colors.
 */

// ─── HSL ↔ Hex helpers ────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** hex (#RRGGBB or RRGGBB) → [h°, s%, l%]. Returns [0, 0, 50] for invalid input. */
function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  // Guard against NaN (e.g. if hex string was malformed)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 50];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

/** [h°, s%, l%] → hex */
function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  // Clamp to [0, 255] before rounding — floating-point drift can push
  // a channel above 255.5, producing 256 → "100" (3 chars) → invalid hex.
  const toHex = (x: number) =>
    Math.round(Math.min(255, Math.max(0, x * 255))).toString(16).padStart(2, "0");

  return `#${toHex(hue2rgb(p, q, h + 1 / 3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1 / 3))}`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Scale generation ─────────────────────────────────────────────────────────

type Scale = Record<string, string>;

/**
 * Returns a Record of { "50": "#…", "100": "#…", …, "900": "#…" }
 * given a base hex color (treated as the 500-weight value).
 * Falls back to neutral gray if the input is not a valid 6-digit hex.
 */
export function generateScale(baseHex: string): Scale {
  // Normalise: accept with or without #, reject anything else
  const normalised = (baseHex ?? "").trim();
  const safe = /^#?[0-9A-Fa-f]{6}$/.test(normalised)
    ? (normalised.startsWith("#") ? normalised : `#${normalised}`)
    : "#808080";

  const [h, s, l] = hexToHsl(safe);

  // Lighter shades: blend toward white, gently reducing saturation
  function lighter(t: number) {
    return hslToHex(
      h,
      clamp(lerp(s, s * 0.15, t), 0, 100),
      clamp(lerp(l, 97, t), 0, 99)
    );
  }

  // Darker shades: blend toward black, slightly boosting saturation
  function darker(t: number) {
    return hslToHex(
      h,
      clamp(lerp(s, Math.min(s * 1.2, 100), t), 0, 100),
      clamp(lerp(l, 4, t), 1, 99)
    );
  }

  return {
    "50":  lighter(0.94),
    "100": lighter(0.82),
    "200": lighter(0.65),
    "300": lighter(0.46),
    "400": lighter(0.24),
    "500": safe,
    "600": darker(0.22),
    "700": darker(0.44),
    "800": darker(0.63),
    "900": darker(0.78),
  };
}

// ─── CSS generation ───────────────────────────────────────────────────────────

/** Returns a CSS string to inject in <head> overriding the @theme variables. */
export function buildThemeCSS(opts: {
  primaryColor: string;
  neutralColor: string;
  darkMode: boolean;
}): string {
  const primary = generateScale(opts.primaryColor);
  const neutral = generateScale(opts.neutralColor);

  // Light-mode overrides (always applied)
  const lightVars = Object.entries(primary)
    .map(([w, hex]) => `  --color-arena-${w}: ${hex};`)
    .concat(
      Object.entries(neutral).map(([w, hex]) => `  --color-warm-${w}: ${hex};`)
    )
    .join("\n");

  let css = `:root {\n${lightVars}\n}\n`;

  if (opts.darkMode) {
    // Dark mode: invert the scale (50 ↔ 900, 100 ↔ 800, etc.)
    const weights = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
    const reversed = [...weights].reverse();

    const darkPrimary = Object.fromEntries(
      weights.map((w, i) => [`arena-${w}`, primary[reversed[i]]])
    );
    const darkNeutral = Object.fromEntries(
      weights.map((w, i) => [`warm-${w}`, neutral[reversed[i]]])
    );

    const darkVars = [
      ...Object.entries(darkPrimary).map(([k, v]) => `  --color-${k}: ${v};`),
      ...Object.entries(darkNeutral).map(([k, v]) => `  --color-${k}: ${v};`),
      // Override white surfaces to use deepest neutral
      `  --color-white: ${neutral["900"]};`,
      `  color-scheme: dark;`,
    ].join("\n");

    css += `\n[data-theme="dark"] {\n${darkVars}\n}\n`;
    css += `\n[data-theme="dark"] body {\n  background-color: ${neutral["900"]};\n  color: ${neutral["100"]};\n}\n`;
    // Cards / panels that use bg-white need to become the darkest neutral
    css += `\n[data-theme="dark"] .bg-white { background-color: ${neutral["800"]} !important; }\n`;
    css += `\n[data-theme="dark"] .border-white { border-color: ${neutral["700"]} !important; }\n`;
  }

  return css;
}

// ─── Preset palettes (for the picker UI) ─────────────────────────────────────

export const COLOR_PRESETS = [
  { name: "Arena (por defecto)", primary: "#B07D45", neutral: "#787868" },
  { name: "Oceano", primary: "#2563EB", neutral: "#64748B" },
  { name: "Bosque", primary: "#16A34A", neutral: "#6B7280" },
  { name: "Vino", primary: "#9F1239", neutral: "#78716C" },
  { name: "Lavanda", primary: "#7C3AED", neutral: "#6B7280" },
  { name: "Noche", primary: "#0F172A", neutral: "#475569" },
  { name: "Rosa", primary: "#DB2777", neutral: "#9CA3AF" },
  { name: "Naranja", primary: "#EA580C", neutral: "#78716C" },
];
