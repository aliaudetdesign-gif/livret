"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

export function MessagerieSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`);
    }, 250);
  }

  return (
    <div className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        type="text"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Rechercher une discussion..."
        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors"
      />
    </div>
  );
}
