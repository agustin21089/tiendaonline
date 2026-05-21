"use client";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  currentOrden: string;
}

export function SortSelect({ currentOrden }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    params.set("orden", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={currentOrden}
      onChange={handleChange}
      className="h-9 pl-3 pr-8 rounded-lg border border-arena-200 text-sm bg-white text-warm-700 focus:outline-none focus:ring-2 focus:ring-arena-400"
    >
      <option value="nuevo">Más nuevos</option>
      <option value="precio-asc">Precio: menor a mayor</option>
      <option value="precio-desc">Precio: mayor a menor</option>
    </select>
  );
}
