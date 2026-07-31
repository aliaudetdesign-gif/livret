"use client";

import { useState } from "react";

let uid = 0;

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

// Lignes répétables "nom + fichier" pour joindre des formats supplémentaires à
// un logo (ex: AI, EPS, favicon ICO), à la création comme à l'édition.
// Les champs sont nommés extra_label_0/extra_file_0, extra_label_1/... afin
// d'être lus côté serveur (voir collectExtraFormats dans actions.ts).
export function ExtraFormatFields() {
  const [rows, setRows] = useState<number[]>([]);

  function addRow() {
    setRows((prev) => [...prev, uid++]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <p className="text-xs font-medium text-zinc-500">Formats supplémentaires</p>
      )}

      {rows.map((id, index) => (
        <div key={id} className="flex items-end gap-2">
          <div className="flex-1">
            {index === 0 && <label className={labelClass}>Nom du format</label>}
            <input
              name={`extra_label_${index}`}
              placeholder="ex: AI, EPS, Favicon ICO"
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            {index === 0 && <label className={labelClass}>Fichier</label>}
            <input
              name={`extra_file_${index}`}
              type="file"
              className={`${inputClass} file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-100 file:text-zinc-600`}
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(id)}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-400 hover:text-red-600"
            title="Retirer"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="self-start text-xs font-medium text-[var(--color-terracotta)] hover:underline"
      >
        + Ajouter un format
      </button>
    </div>
  );
}
