"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  type CouponInput,
} from "./actions";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

type Props = {
  coupons: Coupon[];
};

const EMPTY: CouponInput = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minOrder: null,
  maxUses: null,
  expiresAt: null,
  active: true,
};

const inputClass =
  "w-full h-9 px-3 rounded-lg border border-arena-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arena-400";

export function CouponsClient({ coupons: initial }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxUses: c.maxUses,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : null,
      active: c.active,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.code.trim()) return toast.error("El código es obligatorio");
    if (form.value <= 0) return toast.error("El valor debe ser mayor a 0");
    setSaving(true);
    try {
      if (editing) {
        await updateCoupon(editing.id, form);
        toast.success("Cupón actualizado");
      } else {
        await createCoupon(form);
        toast.success("Cupón creado");
      }
      setShowModal(false);
      // Reload page to get fresh data
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      toast.error(msg.includes("Unique") ? "Ya existe un cupón con ese código" : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`¿Eliminar el cupón "${code}"?`)) return;
    setDeletingId(id);
    try {
      await deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cupón eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await toggleCoupon(id, active);
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    } catch {
      toast.error("Error al actualizar");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado`);
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  const formatValue = (c: Coupon) =>
    c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-warm-900">Cupones</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            {coupons.length} cupón{coupons.length !== 1 ? "es" : ""} registrado
            {coupons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo cupón
        </Button>
      </div>

      {/* Table */}
      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-arena-200 p-12 text-center">
          <Tag className="w-12 h-12 text-arena-200 mx-auto mb-3" />
          <p className="text-warm-500">No hay cupones creados todavía</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Crear primer cupón
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-arena-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-arena-100 bg-warm-50 text-left">
                <th className="px-4 py-3 font-medium text-warm-600">Código</th>
                <th className="px-4 py-3 font-medium text-warm-600">Descuento</th>
                <th className="px-4 py-3 font-medium text-warm-600">Compra mín.</th>
                <th className="px-4 py-3 font-medium text-warm-600">Usos</th>
                <th className="px-4 py-3 font-medium text-warm-600">Vencimiento</th>
                <th className="px-4 py-3 font-medium text-warm-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-100">
              {coupons.map((c) => {
                const expired = isExpired(c.expiresAt);
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-warm-900 bg-arena-50 px-2 py-0.5 rounded text-xs tracking-wide">
                          {c.code}
                        </code>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-warm-300 hover:text-arena-500 transition-colors"
                          title="Copiar código"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-warm-900">
                      {formatValue(c)}
                      <span className="text-warm-400 font-normal text-xs ml-1">
                        {c.type === "PERCENTAGE" ? "dto." : "fijo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-warm-600">
                      {c.minOrder ? formatPrice(c.minOrder) : <span className="text-warm-300">Sin mínimo</span>}
                    </td>
                    <td className="px-4 py-3 text-warm-600">
                      {c.usedCount}
                      {c.maxUses !== null && (
                        <span className={`text-xs ml-1 ${exhausted ? "text-red-500" : "text-warm-400"}`}>
                          / {c.maxUses}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-warm-600 text-xs">
                      {c.expiresAt ? (
                        <span className={expired ? "text-red-500 font-medium" : ""}>
                          {expired ? "Vencido" : ""}{" "}
                          {new Date(c.expiresAt).toLocaleDateString("es-AR")}
                        </span>
                      ) : (
                        <span className="text-warm-300">Sin vencimiento</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(c.id, !c.active)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        {c.active && !expired && !exhausted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-warm-300" />
                            <span className="text-warm-400">
                              {expired ? "Vencido" : exhausted ? "Agotado" : "Inactivo"}
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-warm-400 hover:text-arena-600 hover:bg-arena-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          disabled={deletingId === c.id}
                          className="p-1.5 text-warm-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
              <h2 className="font-display text-lg font-semibold text-warm-900">
                {editing ? "Editar cupón" : "Nuevo cupón"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-warm-400 hover:text-warm-700 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Código *
                </label>
                <input
                  className={inputClass}
                  placeholder="VERANO25"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                  maxLength={30}
                />
              </div>

              {/* Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    Tipo
                  </label>
                  <select
                    className={inputClass}
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as "PERCENTAGE" | "FIXED",
                      }))
                    }
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={form.type === "PERCENTAGE" ? 1 : 100}
                    max={form.type === "PERCENTAGE" ? 100 : undefined}
                    className={inputClass}
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              {/* Min order */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Compra mínima (opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className={inputClass}
                  placeholder="Sin mínimo"
                  value={form.minOrder ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minOrder: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>

              {/* Max uses */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Máximo de usos (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass}
                  placeholder="Ilimitado"
                  value={form.maxUses ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxUses: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>

              {/* Expires at */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.expiresAt ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expiresAt: e.target.value || null,
                    }))
                  }
                />
              </div>

              {/* Active */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                  className="accent-arena-600 w-4 h-4"
                />
                <span className="text-sm font-medium text-warm-700">Cupón activo</span>
              </label>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-arena-100 bg-warm-50 rounded-b-2xl">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear cupón"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
