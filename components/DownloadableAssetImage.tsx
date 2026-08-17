"use client";

import { useState } from "react";
import { downloadFile, guessFilename } from "@/lib/download";

// Image avec bouton de téléchargement centré au survol, façon LogoCard.
// Sert dans les pages "espace" restées Server Component (AssetSection,
// design/[section]) où l'on ne veut pas convertir toute la carte en client
// juste pour porter le téléchargement.
export function DownloadableAssetImage({ src, alt }: { src: string; alt: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadFile(src, guessFilename(alt, src));
    } catch {
      // best effort
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="group relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-contain" />
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
