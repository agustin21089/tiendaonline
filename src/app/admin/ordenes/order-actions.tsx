"use client";

import { useState } from "react";
import { updateOrder } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Order } from "@/generated/prisma/client";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "PROCESSING", label: "En proceso" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

type OrderStatus = (typeof STATUS_OPTIONS)[number]["value"];

interface Props {
  order: Order;
}

export function OrderActions({ order }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(order.status as OrderStatus);

  async function changeStatus(newStatus: OrderStatus) {
    if (newStatus === status) return;
    setLoading(true);
    setStatus(newStatus);
    try {
      await updateOrder(order.id, { status: newStatus });
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
      setStatus(status); // revert on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-warm-400 shrink-0" />}
      {/* Native <select> escapes overflow:hidden clipping that would cut
          a custom dropdown positioned absolutely inside a table container */}
      <select
        value={status}
        onChange={(e) => changeStatus(e.target.value as OrderStatus)}
        disabled={loading}
        className="h-7 px-2 rounded-lg border border-arena-200 text-xs bg-white text-warm-700
          focus:outline-none focus:ring-2 focus:ring-arena-400 disabled:opacity-50 cursor-pointer"
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
