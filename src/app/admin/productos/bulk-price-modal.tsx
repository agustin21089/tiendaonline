"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, TrendingUp } from "lucide-react";
import { previewBulkPrice, applyBulkPrice, type BulkPriceData } from "./actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  categories: { id: string; name: string; parentId: string | null }[];
}

export function BulkPriceModal({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<
    { id: string; name: string; oldPrice: number; newPrice: number }[]
  >([]);

  const [form, setForm] = useState<BulkPriceData>({
    type: "PERCENTAGE",
    value: 10,
    operation: "INCREASE",
    categoryId: "",
    applyToComparePrice: false,
  });

  async function handlePreview() {
    setLoading(true);
    try {
      const result = await previewBulkPrice(form);
      setPreview(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!confirm("¿Aplicar estos cambios de precio a todos los productos?")) return;
    setLoading(true);
    try {
      await applyBulkPrice(form);
      toast.success("Precios actualizados correctamente");
      setOpen(false);
      setPreview([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <TrendingUp className="w-4 h-4" />
        Actualizar precios
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
              <h2 className="font-display text-lg font-semibold text-warm-900">
                Actualización masiva de precios
              </h2>
              <button
                onClick={() => { setOpen(false); setPreview([]); }}
                className="p-1 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-arena-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Tipo de ajuste */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-warm-700">Tipo de ajuste</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                    className="h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-warm-700">Operación</label>
                  <select
                    value={form.operation}
                    onChange={(e) => setForm({ ...form, operation: e.target.value as "INCREASE" | "DECREASE" })}
                    className="h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
                  >
                    <option value="INCREASE">Aumentar</option>
                    <option value="DECREASE">Disminuir</option>
                  </select>
                </div>
              </div>

              {/* Valor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-warm-700">
                  Valor ({form.type === "PERCENTAGE" ? "%" : "$"})
                </label>
                <input
                  type="number"
                  min={0}
                  step={form.type === "PERCENTAGE" ? 1 : 100}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  className="h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
                />
              </div>

              {/* Categoría */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-warm-700">Aplicar a categoría</label>
                <select
                  value={form.categoryId ?? ""}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
                >
                  <option value="">Todos los productos</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `  └ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.applyToComparePrice}
                  onChange={(e) => setForm({ ...form, applyToComparePrice: e.target.checked })}
                  className="rounded border-arena-300"
                />
                <span className="text-sm text-warm-700">También actualizar precio comparativo (tachado)</span>
              </label>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="bg-arena-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-2">
                    Vista previa (primeros {preview.length} productos)
                  </p>
                  {preview.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-warm-700 truncate flex-1 mr-2">{p.name}</span>
                      <div className="flex items-center gap-1.5 text-xs shrink-0">
                        <span className="text-warm-400 line-through">
                          {formatPrice(p.oldPrice)}
                        </span>
                        <span>→</span>
                        <span className={`font-semibold ${p.newPrice > p.oldPrice ? "text-green-700" : "text-red-700"}`}>
                          {formatPrice(p.newPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  loading={loading}
                  className="flex-1"
                >
                  Vista previa
                </Button>
                <Button
                  onClick={handleApply}
                  loading={loading}
                  disabled={preview.length === 0}
                  className="flex-1"
                >
                  Aplicar cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
