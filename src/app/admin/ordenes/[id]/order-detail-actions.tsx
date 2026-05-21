"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOrder } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Order } from "@/generated/prisma/client";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "PROCESSING", label: "En proceso" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export function OrderDetailActions({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status as string);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      await updateOrder(order.id, {
        status: status as Parameters<typeof updateOrder>[1]["status"],
        trackingNumber: tracking || undefined,
      });
      toast.success("Orden actualizada");
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-1">Estado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-warm-600 mb-1">
          N° seguimiento (opcional)
        </label>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="OCA-123456"
          className="w-full h-9 px-3 rounded-lg border border-arena-200 text-sm focus:outline-none focus:ring-2 focus:ring-arena-400"
        />
      </div>

      <Button onClick={handleSave} loading={loading} className="w-full" size="sm">
        Guardar cambios
      </Button>
    </div>
  );
}
