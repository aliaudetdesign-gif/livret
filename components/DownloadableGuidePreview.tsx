"use client";

import { useState } from "react";
import { downloadFile, guessFilename } from "@/lib/download";

// Aperçu d'un guide (PDF) avec bouton de téléchargement centré au survol,
// même principe que DownloadableAssetImage mais avec une source d'aperçu
// (image générée depuis la 1re page du PDF, peut être absente) distincte de
// la source à télécharger (le PDF lui-même).
export function DownloadableGuidePreview({
  previewUrl,
  fileUrl,
  alt,
}: {
  previewUrl: string | null;
  fileUrl: string;
  alt: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadFile(fileUrl, guessFilename(alt, fileUrl));
    } catch {
      // best effort
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="group relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-80">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M14 2v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs">PDF uniquement</span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-ink-900/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-white/95 text-ink-900 text-xs font-semibold rounded-full px-4 py-2 shadow-[0_8px_20px_-8px_rgba(23,22,26,0.5)] disabled:opacity-60 disabled:cursor-wait"
        >
          {isDownloading ? "Téléchargement..." : "↓ Télécharger"}
        </button>
      </div>
    </div>
  );
}
