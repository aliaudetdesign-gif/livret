"use client";

import { useState } from "react";

export function ColorSwatch({ label, hex }: { label: string; hex: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={handleClick}
      className="text-left bg-white border border-zinc-100 rounded-lg overflow-hidden hover:border-[var(--color-terracotta)] hover:shadow-md transition-all duration-300"
    >
      <div className="h-20" style={{ backgroundColor: hex }} />
      <div className="p-3">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-zinc-500">
          {copied ? "Copié !" : hex}
        </div>
      </div>
    </button>
  );
}
