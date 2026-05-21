/**
 * Andreani-compatible shipping calculator.
 * Uses zone-based rates derived from Argentine postal codes.
 * When ANDREANI_CLIENT_ID + ANDREANI_CLIENT_SECRET are set, attempts the real API.
 * Falls back to zone table otherwise.
 */

export type ShippingOption = {
  id: string;
  name: string;
  price: number;
  days: string;
  zone: string;
};

export type ShippingResult =
  | { ok: true; options: ShippingOption[]; free: boolean }
  | { ok: false; error: string };

// ─── Zone map ─────────────────────────────────────────────────────────────────

type ZoneKey = "caba" | "gba" | "pba_interior" | "cordoba_sf" | "cuyo_er" | "noa_nea" | "patagonia";

const ZONE_NAMES: Record<ZoneKey, string> = {
  caba: "CABA",
  gba: "Gran Buenos Aires",
  pba_interior: "Buenos Aires Interior",
  cordoba_sf: "Córdoba / Santa Fe",
  cuyo_er: "Cuyo / Entre Ríos",
  noa_nea: "NOA / NEA",
  patagonia: "Patagonia",
};

// Argentine 4-digit postal code ranges → zone
function zipToZone(zip: string): ZoneKey {
  const n = parseInt(zip.replace(/\D/g, "").slice(0, 4), 10);
  if (isNaN(n)) return "pba_interior";

  if (n >= 1000 && n <= 1499) return "caba";
  if (n >= 1500 && n <= 1999) return "gba";
  if (n >= 2000 && n <= 2799) return "cordoba_sf"; // Santa Fe / Entre Ríos north
  if (n >= 2800 && n <= 2999) return "cuyo_er";    // Entre Ríos south
  if (n >= 3000 && n <= 3999) return "noa_nea";    // Litoral: Corrientes, Misiones, Chaco, Formosa
  if (n >= 4000 && n <= 4999) return "noa_nea";    // NOA: Tucumán, Salta, Jujuy, etc.
  if (n >= 5000 && n <= 5999) return "cordoba_sf"; // Córdoba / SL
  if (n >= 6000 && n <= 7999) return "pba_interior"; // Buenos Aires interior
  if (n >= 8000 && n <= 8999) return "patagonia";  // Neuquén, Río Negro, Chubut
  if (n >= 9000 && n <= 9999) return "patagonia";  // Santa Cruz, Tierra del Fuego
  // Mendoza, San Juan, La Rioja = 5400–5700 (already cordoba_sf) / cuyo_er fallback
  return "pba_interior";
}

// ─── Rate tables (ARS — approximate Andreani 2025 rates) ──────────────────────

type RateTable = { standard: number; express: number; days: string; expressDays: string };

const RATES: Record<ZoneKey, RateTable> = {
  caba:         { standard: 1_200,  express: 1_900,  days: "1-2",  expressDays: "24hs" },
  gba:          { standard: 1_500,  express: 2_300,  days: "1-3",  expressDays: "24hs" },
  pba_interior: { standard: 2_200,  express: 3_400,  days: "3-5",  expressDays: "48hs" },
  cordoba_sf:   { standard: 2_400,  express: 3_600,  days: "3-5",  expressDays: "48hs" },
  cuyo_er:      { standard: 2_800,  express: 4_200,  days: "4-6",  expressDays: "72hs" },
  noa_nea:      { standard: 3_200,  express: 4_800,  days: "5-7",  expressDays: "72hs" },
  patagonia:    { standard: 3_900,  express: 5_800,  days: "7-10", expressDays: "96hs" },
};

// ─── Main function ─────────────────────────────────────────────────────────────

export async function calculateShipping(
  zip: string,
  orderSubtotal: number,
  freeShippingMin?: number | null
): Promise<ShippingResult> {
  const cleanZip = zip.trim();
  if (!cleanZip || cleanZip.length < 4) {
    return { ok: false, error: "Código postal inválido" };
  }

  // Try real Andreani API if credentials are configured
  const clientId = process.env.ANDREANI_CLIENT_ID;
  const clientSecret = process.env.ANDREANI_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      return await fetchAndreaniRates(cleanZip, clientId, clientSecret, orderSubtotal, freeShippingMin);
    } catch (err) {
      console.warn("Andreani API error, falling back to zone table:", err);
    }
  }

  // Zone-based fallback
  return zoneBasedRates(cleanZip, orderSubtotal, freeShippingMin);
}

function zoneBasedRates(
  zip: string,
  subtotal: number,
  freeShippingMin?: number | null
): ShippingResult {
  const zone = zipToZone(zip);
  const rates = RATES[zone];
  const zoneName = ZONE_NAMES[zone];
  const isFree = freeShippingMin != null && subtotal >= freeShippingMin;

  const options: ShippingOption[] = [
    {
      id: "andreani_standard",
      name: "Andreani — Entrega estándar",
      price: isFree ? 0 : rates.standard,
      days: rates.days + " días hábiles",
      zone: zoneName,
    },
    {
      id: "andreani_express",
      name: "Andreani — Express",
      price: rates.express,
      days: rates.expressDays,
      zone: zoneName,
    },
  ];

  return { ok: true, options, free: isFree };
}

// ─── Real Andreani API (stub — requires business account) ─────────────────────

async function fetchAndreaniRates(
  zip: string,
  clientId: string,
  clientSecret: string,
  subtotal: number,
  freeShippingMin?: number | null
): Promise<ShippingResult> {
  // Andreani API v2 authentication
  const authRes = await fetch("https://api.andreani.com/v2/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: clientId, clave: clientSecret }),
    signal: AbortSignal.timeout(5000),
  });

  if (!authRes.ok) throw new Error(`Andreani auth error: ${authRes.status}`);

  const { token } = await authRes.json() as { token: string };

  // Tariffs endpoint
  const tarifasRes = await fetch(
    `https://api.andreani.com/v2/tarifas?cpDestino=${zip}&contrato=AND00001`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!tarifasRes.ok) throw new Error(`Andreani tarifas error: ${tarifasRes.status}`);

  const tarifas = await tarifasRes.json() as Array<{
    producto: string;
    tarifaConIVA: number;
    plazoDeEntrega?: string;
  }>;

  const isFree = freeShippingMin != null && subtotal >= freeShippingMin;

  const options: ShippingOption[] = tarifas.slice(0, 3).map((t) => ({
    id: `andreani_${t.producto.toLowerCase().replace(/\s+/g, "_")}`,
    name: `Andreani — ${t.producto}`,
    price: isFree && t.producto.toLowerCase().includes("estándar") ? 0 : t.tarifaConIVA,
    days: t.plazoDeEntrega ?? "A confirmar",
    zone: zip,
  }));

  return { ok: true, options, free: isFree };
}
