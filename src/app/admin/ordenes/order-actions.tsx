"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOrder } from "./actions";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: OrderStatus) {
    setLoading(true);
    setOpen(false);
    try {
      await updateOrder(order.id, { status });
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        loading={loading}
      >
        Estado <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-arena-200 shadow-lg z-20 py-1 min-w-36">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => changeStatus(value)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-arena-50 transition-colors ${
                  order.status === value ? "text-arena-600 font-medium" : "text-warm-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
