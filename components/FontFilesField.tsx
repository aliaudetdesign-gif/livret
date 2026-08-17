"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { detectFontWeight, FONT_FILE_EXTENSIONS } from "@/lib/fontDetection";

export interface PendingFontFile {
  file: File;
  weight: string;
  detecting: boolean;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

// Champ réutilisable (ajout ET édition) pour joindre un ou plusieurs fichiers
// de police : la graisse (Regular, SemiBold, Bold...) est détectée
// automatiquement à la sélection via opentype.js, et reste modifiable au cas
// où la détection se trompe ou que le fichier ne l'expose pas clairement.
export function FontFilesField({
  entries,
  onChange,
  idPrefix,
  label = "Fichiers de police",
}: {
  entries: PendingFontFile[];
  onChange: Dispatch<SetStateAction<PendingFontFile[]>>;
  idPrefix: string;
  label?: string;
}) {
  const [inputKey, setInputKey] = useState(0);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const newEntries: PendingFontFile[] = files.map((file) => ({
      file,
      weight: "Détection...",
      detecting: true,
    }));
    const startIndex = entries.length;
    onChange([...entries, ...newEntries]);

    // Réinitialise l'input pour permettre de resélectionner le même fichier.
    setInputKey((k) => k + 1);

    const detected = await Promise.all(files.map((file) => detectFontWeight(file)));
    onChange((prev: PendingFontFile[]) => {
      const next = [...prev];
      detected.forEach((weight, i) => {
        const idx = startIndex + i;
        if (next[idx]) next[idx] = { ...next[idx], weight, detecting: false };
      });
      return next;
    });
  }

  function updateWeight(index: number, weight: string) {
    const next = entries.slice();
    next[index] = { ...next[index], weight };
    onChange(next);
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label htmlFor={`${idPrefix}-font-files`} className={labelClass}>
        {label}
      </label>
      <input
        key={inputKey}
        id={`${idPrefix}-font-files`}
        type="file"
        multiple
        accept={FONT_FILE_EXTENSIONS.join(",")}
        onChange={(e) => handleFilesSelected(e.target.files)}
        className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
      />
      <p className="text-[11px] text-ink-400 mt-1">
        La graisse (Regular, Bold...) est détectée automatiquement, modifiable si besoin.
      </p>

      {entries.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          {entries.map((entry, i) => (
            <div key={`${entry.file.name}-${i}`} className="flex items-center gap-2">
              <span className="text-xs text-ink-500 truncate max-w-[40%]" title={entry.file.name}>
                {entry.file.name}
              </span>
              <input
                value={entry.weight}
                onChange={(e) => updateWeight(i, e.target.value)}
                disabled={entry.detecting}
                className={`${inputClass} py-1 text-xs flex-1 disabled:opacity-60`}
              />
              <button
                type="button"
                onClick={() => removeEntry(i)}
                className="text-xs text-ink-400 hover:text-err-600 transition-colors px-1"
                title="Retirer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
