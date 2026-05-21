"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  seedDefaultZones,
} from "./actions";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Rate = {
  id: string;
  name: string;
  price: number;
  freeAboveOrder: number | null;
  estimatedDays: string | null;
};

type Zone = {
  id: string;
  name: string;
  provinces: string[];
  active: boolean;
  rates: Rate[];
};

const inputClass =
  "w-full h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400";

function RateRow({
  rate,
  zoneId,
  onDelete,
}: {
  rate: Rate;
  zoneId: string;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(rate.name);
  const [price, setPrice] = useState(rate.price);
  const [freeAbove, setFreeAbove] = useState<number | null>(rate.freeAboveOrder);
  const [days, setDays] = useState(rate.estimatedDays ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateShippingRate(rate.id, {
        name,
        price,
        freeAboveOrder: freeAbove,
        estimatedDays: days || null,
        zoneId,
      });
      setEditing(false);
      toast.success("Tarifa actualizada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="grid grid-cols-2 gap-2 p-3 bg-arena-50 rounded-lg">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input type="number" className={inputClass} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Precio" />
        <input type="number" className={inputClass} value={freeAbove ?? ""} onChange={(e) => setFreeAbove(e.target.value ? Number(e.target.value) : null)} placeholder="Gratis desde $..." />
        <input className={inputClass} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Días estimados" />
        <div className="col-span-2 flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="flex-1">{saving ? "Guardando..." : "Guardar"}</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-arena-50 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-warm-800">{rate.name}</p>
        <p className="text-xs text-warm-400">
          {rate.estimatedDays ?? "Días no especificados"}
          {rate.freeAboveOrder && (
            <span className="ml-2 text-green-600">· Gratis desde {formatPrice(rate.freeAboveOrder)}</span>
          )}
        </p>
      </div>
      <span className="text-sm font-semibold text-warm-900 shrink-0">{formatPrice(rate.price)}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-warm-400 hover:text-arena-600 rounded">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(rate.id)} className="p-1 text-warm-400 hover:text-red-600 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ShippingClient({ zones: initial }: { zones: Zone[] }) {
  const [zones, setZones] = useState<Zone[]>(initial);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initial.map((z) => z.id)));
  const [seeding, setSeeding] = useState(false);

  // Zone modal
  const [zoneModal, setZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneProvinces, setZoneProvinces] = useState("");
  const [zoneActive, setZoneActive] = useState(true);
  const [savingZone, setSavingZone] = useState(false);

  // Rate modal
  const [rateModal, setRateModal] = useState<{ zoneId: string } | null>(null);
  const [rateName, setRateName] = useState("");
  const [ratePrice, setRatePrice] = useState(0);
  const [rateFreeAbove, setRateFreeAbove] = useState<string>("");
  const [rateDays, setRateDays] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateZone() {
    setEditingZone(null);
    setZoneName("");
    setZoneProvinces("");
    setZoneActive(true);
    setZoneModal(true);
  }

  function openEditZone(z: Zone) {
    setEditingZone(z);
    setZoneName(z.name);
    setZoneProvinces(z.provinces.join(", "));
    setZoneActive(z.active);
    setZoneModal(true);
  }

  async function saveZone() {
    if (!zoneName.trim()) return toast.error("Nombre requerido");
    const provinces = zoneProvinces.split(",").map((s) => s.trim()).filter(Boolean);
    setSavingZone(true);
    try {
      if (editingZone) {
        await updateShippingZone(editingZone.id, zoneName, provinces, zoneActive);
        toast.success("Zona actualizada");
      } else {
        await createShippingZone(zoneName, provinces);
        toast.success("Zona creada");
      }
      setZoneModal(false);
      window.location.reload();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingZone(false);
    }
  }

  async function handleDeleteZone(id: string, name: string) {
    if (!confirm(`¿Eliminar la zona "${name}" y todas sus tarifas?`)) return;
    try {
      await deleteShippingZone(id);
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast.success("Zona eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function openAddRate(zoneId: string) {
    setRateModal({ zoneId });
    setRateName("");
    setRatePrice(0);
    setRateFreeAbove("");
    setRateDays("");
  }

  async function saveRate() {
    if (!rateModal) return;
    if (!rateName.trim() || ratePrice <= 0) return toast.error("Nombre y precio requeridos");
    setSavingRate(true);
    try {
      await createShippingRate({
        name: rateName,
        price: ratePrice,
        freeAboveOrder: rateFreeAbove ? Number(rateFreeAbove) : null,
        estimatedDays: rateDays || null,
        zoneId: rateModal.zoneId,
      });
      setRateModal(null);
      toast.success("Tarifa creada");
      window.location.reload();
    } catch {
      toast.error("Error al crear tarifa");
    } finally {
      setSavingRate(false);
    }
  }

  async function handleDeleteRate(zoneId: string, rateId: string) {
    try {
      await deleteShippingRate(rateId);
      setZones((prev) =>
        prev.map((z) =>
          z.id === zoneId ? { ...z, rates: z.rates.filter((r) => r.id !== rateId) } : z
        )
      );
      toast.success("Tarifa eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function handleSeedDefaults() {
    setSeeding(true);
    try {
      const result = await seedDefaultZones();
      if (result.skipped) {
        toast.info("Ya existen zonas configuradas");
      } else {
        toast.success(`${result.created} zonas creadas con tarifas predeterminadas`);
        window.location.reload();
      }
    } catch {
      toast.error("Error al crear zonas");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-warm-900">Envíos</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            Zonas y tarifas de Andreani · {zones.length} zona{zones.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {zones.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {seeding ? "Cargando..." : "Zonas predeterminadas"}
            </Button>
          )}
          <Button onClick={openCreateZone} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva zona
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Truck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>Calculadora de envíos Andreani:</strong> cuando el cliente ingresa su CP en el checkout,
          el sistema calcula el costo según la zona correspondiente. Configurá aquí las tarifas por zona.
          Si configurás <code className="bg-blue-100 px-1 rounded text-xs">ANDREANI_CLIENT_ID</code> y{" "}
          <code className="bg-blue-100 px-1 rounded text-xs">ANDREANI_CLIENT_SECRET</code> en las variables
          de entorno, se usará la API real de Andreani.
        </div>
      </div>

      {/* Zones list */}
      {zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-arena-200 p-12 text-center">
          <Truck className="w-12 h-12 text-arena-200 mx-auto mb-3" />
          <p className="text-warm-500 mb-4">No hay zonas de envío configuradas</p>
          <Button onClick={handleSeedDefaults} disabled={seeding}>
            {seeding ? "Cargando..." : "Cargar zonas de Argentina"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-xl border border-arena-200 overflow-hidden">
              {/* Zone header */}
              <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-warm-50 transition-colors">
                <button
                  onClick={() => toggleExpand(zone.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  {expanded.has(zone.id) ? (
                    <ChevronDown className="w-4 h-4 text-warm-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-warm-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-warm-800 text-sm">{zone.name}</span>
                      {!zone.active && (
                        <span className="text-xs text-warm-400 bg-warm-100 px-1.5 py-0.5 rounded">
                          Inactiva
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warm-400 truncate">
                      {zone.provinces.join(" · ") || "Sin provincias"}
                    </p>
                  </div>
                  <span className="text-xs text-warm-400 shrink-0 mr-2">
                    {zone.rates.length} tarifa{zone.rates.length !== 1 ? "s" : ""}
                  </span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openAddRate(zone.id)}
                    className="p-1.5 text-warm-400 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
                    title="Agregar tarifa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditZone(zone)}
                    className="p-1.5 text-warm-400 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
                    title="Editar zona"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="p-1.5 text-warm-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar zona"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rates */}
              {expanded.has(zone.id) && (
                <div className="border-t border-arena-100 px-5 py-3 space-y-1">
                  {zone.rates.length === 0 ? (
                    <p className="text-sm text-warm-400 text-center py-2">
                      Sin tarifas —{" "}
                      <button
                        onClick={() => openAddRate(zone.id)}
                        className="text-arena-600 underline"
                      >
                        Agregar tarifa
                      </button>
                    </p>
                  ) : (
                    zone.rates.map((rate) => (
                      <RateRow
                        key={rate.id}
                        rate={rate}
                        zoneId={zone.id}
                        onDelete={(rateId) => handleDeleteRate(zone.id, rateId)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone Modal */}
      {zoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
              <h2 className="font-display text-lg font-semibold text-warm-900">
                {editingZone ? "Editar zona" : "Nueva zona"}
              </h2>
              <button onClick={() => setZoneModal(false)} className="text-warm-400 hover:text-warm-700 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Nombre *</label>
                <input className={inputClass} value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="CABA, Gran Buenos Aires..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Provincias (separadas por coma)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400 resize-none"
                  rows={3}
                  value={zoneProvinces}
                  onChange={(e) => setZoneProvinces(e.target.value)}
                  placeholder="Buenos Aires, Córdoba, Santa Fe"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={zoneActive} onChange={(e) => setZoneActive(e.target.checked)} className="accent-arena-600 w-4 h-4" />
                <span className="text-sm font-medium text-warm-700">Zona activa</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-arena-100 bg-warm-50 rounded-b-2xl">
              <Button onClick={saveZone} disabled={savingZone} className="flex-1">
                {savingZone ? "Guardando..." : editingZone ? "Guardar cambios" : "Crear zona"}
              </Button>
              <Button variant="outline" onClick={() => setZoneModal(false)} disabled={savingZone}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {rateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
              <h2 className="font-display text-lg font-semibold text-warm-900">Nueva tarifa</h2>
              <button onClick={() => setRateModal(null)} className="text-warm-400 hover:text-warm-700 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Nombre *</label>
                <input className={inputClass} value={rateName} onChange={(e) => setRateName(e.target.value)} placeholder="Estándar, Express..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Precio * ($)</label>
                  <input type="number" min={0} step={100} className={inputClass} value={ratePrice} onChange={(e) => setRatePrice(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Días estimados</label>
                  <input className={inputClass} value={rateDays} onChange={(e) => setRateDays(e.target.value)} placeholder="3-5 días hábiles" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Envío gratis desde (opcional)</label>
                <input type="number" min={0} step={1000} className={inputClass} value={rateFreeAbove} onChange={(e) => setRateFreeAbove(e.target.value)} placeholder="Ej: 50000" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-arena-100 bg-warm-50 rounded-b-2xl">
              <Button onClick={saveRate} disabled={savingRate} className="flex-1">
                {savingRate ? "Guardando..." : "Crear tarifa"}
              </Button>
              <Button variant="outline" onClick={() => setRateModal(null)} disabled={savingRate}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
