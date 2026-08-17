"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import {
  deleteSectionAsset,
  deleteSectionAssets,
  updateSectionAsset,
  type SectionAssetActionState,
} from "@/app/agence/projets/[id]/actions";
import { formatShortDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InfoPopover } from "@/components/InfoPopover";
import { downloadFile, guessFilename } from "@/lib/download";
import { generatePdfPreview } from "@/lib/pdfPreview";
import { LOGO_FORMAT_DESCRIPTIONS } from "@/lib/types";
import type { SectionAsset, SectionAssetMetadata, SectionTemplate } from "@/lib/types";
import type { FormEvent, ReactNode } from "react";

const initialState: SectionAssetActionState = { error: null };

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1";

function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-clay-600"
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
  );
}

// Dégradés cycliques pour les miniatures vidéo sans image d'aperçu réelle.
const VIDEO_GRADIENTS = [
  "linear-gradient(135deg, var(--clay-400), var(--clay-600))",
  "linear-gradient(135deg, var(--sage), #3f4a37)",
  "linear-gradient(135deg, var(--sand), var(--bark))",
];

function PlayButton() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="w-11 h-11 rounded-full bg-white/92 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)] flex items-center justify-center">
        <span className="block w-0 h-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-ink-900 translate-x-[2px]" />
      </span>
    </span>
  );
}

// Carte "Vidéos" : miniature carrée (même gabarit que les images, pour une
// grille homogène), bouton lecture, titre + date d'ajout et bouton de
// téléchargement alignés en bas à droite (placement distinct du survol
// centré utilisé sur les images : la vidéo garde son bouton lecture au
// centre, le téléchargement se pose à côté du texte). Utilisée aussi bien
// dans la section dédiée "Vidéos" que pour tout fichier vidéo déposé dans
// une section créée par l'utilisateur (générique, mockups...).
function VideoAssetCard({
  asset,
  index,
  isDownloading,
  onDownload,
}: {
  asset: SectionAsset;
  index: number;
  isDownloading: boolean;
  onDownload: (e: React.MouseEvent) => void;
}) {
  const isVideoFile = asset.file_type.startsWith("video/");
  return (
    <>
      <div
        className="relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55"
        style={{ backgroundImage: VIDEO_GRADIENTS[index % VIDEO_GRADIENTS.length] }}
      >
        {isVideoFile && (
          <video
            src={asset.file_url}
            preload="metadata"
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <PlayButton />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{asset.label}</div>
          <div className="text-[11.5px] text-ink-400 mt-0.5">
            Ajoutée le {formatShortDate(asset.created_at)}
          </div>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          title="Télécharger"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-clay-600 transition-colors disabled:opacity-50"
        >
          ↓
        </button>
      </div>
    </>
  );
}

// Carte "Interfaces Figma" : écran présenté dans un cadre navigateur, bouton
// de téléchargement centré au survol sur l'aperçu (même traitement que les
// visuels/moodboard et les mockups).
function FigmaAssetCard({
  asset,
  isDownloading,
  onDownload,
}: {
  asset: SectionAsset;
  isDownloading: boolean;
  onDownload: (e: React.MouseEvent) => void;
}) {
  const isImage = asset.file_type.startsWith("image/");
  const hasPreview = isImage || !!asset.preview_url;
  return (
    <div className="rounded-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-white/50 border-b border-white/60">
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
      </div>
      <div className="relative aspect-[9/13] bg-white/55">
        {hasPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={isImage ? asset.file_url : (asset.preview_url as string)}
            alt={asset.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PdfIcon />
          </div>
        )}
        {hasPreview && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="bg-white/95 text-ink-900 text-xs font-semibold rounded-full px-4 py-2 shadow-[0_8px_20px_-8px_rgba(23,22,26,0.5)] disabled:opacity-60 disabled:cursor-wait"
            >
              {isDownloading ? "Téléchargement..." : "↓ Télécharger"}
            </button>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12.5px] font-semibold truncate">{asset.label}</div>
      </div>
    </div>
  );
}

// Libellés des formats standards pour un fichier de section (mêmes clés que
// les logos, voir FORMAT_LABELS dans LogoCard.tsx).
const SECTION_FORMAT_LABELS: Record<"pdf" | "png" | "svg", string> = {
  pdf: "PDF",
  png: "PNG",
  svg: "SVG",
};

// Carte "Plusieurs formats" : même principe que LogoCard (pastilles de
// formats sélectionnables avant téléchargement), utilisée dès que
// asset.metadata contient au moins un format déposé en mode multi-format à
// l'ajout (voir SectionAssetUploadForm). Prioritaire sur le rendu par
// template (vidéo/Figma) : un fichier multi-format reste avant tout un
// visuel/PDF, jamais une vidéo.
function MultiFormatAssetCard({ asset, metadata }: { asset: SectionAsset; metadata: SectionAssetMetadata }) {
  const availableFormats = (Object.keys(SECTION_FORMAT_LABELS) as (keyof typeof SECTION_FORMAT_LABELS)[]).filter(
    (key) => metadata.formats?.[key]
  );

  const badgeItems = [
    ...availableFormats.map((key) => ({
      key: key as string,
      label: SECTION_FORMAT_LABELS[key],
      url: metadata.formats[key] as string,
      description: LOGO_FORMAT_DESCRIPTIONS[key],
    })),
    ...(metadata.extraFormats ?? []).map((extra, index) => ({
      key: `extra-${index}`,
      label: extra.label,
      url: extra.url,
      description: undefined as string | undefined,
    })),
  ];

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  function toggleFormat(e: React.MouseEvent, key: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const items =
      selectedFormats.size > 0 ? badgeItems.filter((item) => selectedFormats.has(item.key)) : badgeItems;

    setIsDownloading(true);
    try {
      for (const item of items) {
        try {
          await downloadFile(item.url, guessFilename(`${asset.label}-${item.label}`, item.url));
        } catch {
          // best effort : on continue avec les autres formats sélectionnés
        }
      }
    } finally {
      setIsDownloading(false);
    }
  }

  // Aperçu : PNG ou SVG affichés directement, sinon repli sur l'aperçu généré
  // côté navigateur depuis un PDF seul (voir generatePdfPreview), même
  // logique que LogoCard.
  const previewUrl = metadata.formats.png ?? metadata.formats.svg ?? metadata.generatedPreview ?? null;
  const isGeneratedFallback = !metadata.formats.png && !metadata.formats.svg && !!previewUrl;

  return (
    <>
      <div className="relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={asset.label}
            className={isGeneratedFallback ? "w-full h-full object-cover" : "w-full h-full object-contain"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PdfIcon />
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
      <div className="text-sm font-medium truncate">{asset.label}</div>
      {badgeItems.length > 0 && (
        <>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {badgeItems.map((item) => {
              const isSelected = selectedFormats.has(item.key);
              const badge = (
                <button
                  type="button"
                  onClick={(e) => toggleFormat(e, item.key)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-ink-900 text-white border-ink-900"
                      : "bg-white/70 text-ink-500 border-white/60 hover:bg-white/90 hover:text-ink-900"
                  }`}
                >
                  {item.label}
                </button>
              );
              return (
                <span key={item.key}>
                  {item.description ? <InfoPopover text={item.description}>{badge}</InfoPopover> : badge}
                </span>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-400 mt-1">
            {selectedFormats.size === 0
              ? "Sélectionne le format souhaité"
              : `${selectedFormats.size} format${selectedFormats.size > 1 ? "s" : ""} sélectionné${selectedFormats.size > 1 ? "s" : ""}`}
          </p>
        </>
      )}
    </>
  );
}

// Carte d'un fichier de section complémentaire. En mode agence (editable) :
// menu ⋮ (sélectionner / modifier / supprimer, sur le modèle de DocumentCard)
// et édition inline (nom + remplacement optionnel du fichier). Le rendu
// s'adapte au template de la section (vidéos, interfaces Figma, mockups).
function SectionAssetCard({
  asset,
  projectId,
  projectSectionId,
  template,
  index,
  editable,
  selectionMode,
  selected,
  onToggleSelect,
  onSelectFromMenu,
  onDelete,
  isDeleting,
}: {
  asset: SectionAsset;
  projectId: string;
  projectSectionId: string;
  template: SectionTemplate | null;
  index: number;
  editable: boolean;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onSelectFromMenu: (asset: SectionAsset) => void;
  onDelete: (asset: SectionAsset) => void;
  isDeleting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateSectionAsset, initialState);
  const wasPending = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadFile(asset.file_url, guessFilename(asset.label, asset.file_url));
    } catch {
      // best effort
    } finally {
      setIsDownloading(false);
    }
  }

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [menuOpen]);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Remplacement de fichier par un PDF : même interception que dans
  // SectionAssetUploadForm.tsx pour générer un aperçu côté navigateur avant
  // l'envoi (voir lib/pdfPreview.ts).
  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    e.preventDefault();
    const formData = new FormData(form);

    const previewBlob = await generatePdfPreview(file);
    if (previewBlob) {
      formData.append("pdf_preview_file", previewBlob, "preview.png");
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  const isImage = asset.file_type.startsWith("image/");
  // Pour un PDF, on affiche l'aperçu généré à l'ajout (preview_url) comme une
  // vraie image, avec le même bouton de téléchargement au survol que les
  // images natives. Repli sur l'icône générique si aucun aperçu n'a pu être
  // généré (échec silencieux côté navigateur, voir lib/pdfPreview.ts).
  const genericPreview =
    isImage || asset.preview_url ? (
      <div className="relative aspect-square w-full mb-2 rounded-field overflow-hidden bg-white/55">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isImage ? asset.file_url : (asset.preview_url as string)}
          alt={asset.label}
          className="w-full h-full object-contain"
        />
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
    ) : (
      <div className="aspect-square w-full mb-2 rounded-field bg-white/55 flex items-center justify-center">
        <PdfIcon />
      </div>
    );

  // Calculé ici (avant les rendus alternatifs sélection/édition) pour que
  // l'aperçu propre au template (vidéo, Figma) reste visible même en mode
  // sélection, plutôt que de retomber sur l'icône générique. Les mockups
  // n'ont pas de rendu dédié : le fichier est déjà la maquette finale, on
  // l'affiche donc comme une photo normale (même traitement que le générique).
  // Le bouton de téléchargement suit deux placements distincts : centré au
  // survol de l'image pour tout ce qui est visuel (générique/mockups, Figma),
  // en bas à droite au niveau du titre/date pour les vidéos.
  // Le choix se fait sur le type réel du fichier plutôt que sur le seul
  // template de la section : une vidéo déposée dans une section générique ou
  // mockups doit suivre les mêmes paramètres que dans la section dédiée
  // "Vidéos" (au lieu de retomber sur l'icône PDF générique faute d'image).
  const isVideoAsset = asset.file_type.startsWith("video/");
  // Fichier ajouté en mode "Plusieurs formats" (voir SectionAssetUploadForm) :
  // prioritaire sur le rendu par template, un fichier multi-format reste un
  // visuel/PDF (jamais une vidéo côté agence à ce jour).
  const sectionMetadata = asset.metadata as unknown as SectionAssetMetadata | null;
  const hasMultiFormat = !!sectionMetadata?.formats && Object.values(sectionMetadata.formats).some(Boolean);

  const cardBody = hasMultiFormat ? (
    <MultiFormatAssetCard asset={asset} metadata={sectionMetadata as SectionAssetMetadata} />
  ) : isVideoAsset ? (
    <VideoAssetCard
      asset={asset}
      index={index}
      isDownloading={isDownloading}
      onDownload={handleDownload}
    />
  ) : template === "figma" ? (
    <FigmaAssetCard asset={asset} isDownloading={isDownloading} onDownload={handleDownload} />
  ) : (
    <>
      {genericPreview}
      <div className="text-sm font-medium truncate">{asset.label}</div>
    </>
  );

  const cardPadding = template === "figma" && !hasMultiFormat ? "p-0" : "p-4";

  if (editable && selectionMode) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleSelect}
        className={`relative block glass ${cardPadding} rounded-card cursor-pointer`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 z-10 w-4 h-4 accent-clay-500"
        />
        {cardBody}
      </div>
    );
  }

  if (editable && isEditing) {
    return (
      <div className="glass rounded-card p-4">
        <form action={formAction} onSubmit={handleEditSubmit} className="flex flex-col gap-2">
          <input type="hidden" name="asset_id" value={asset.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="project_section_id" value={projectSectionId} />

          <div>
            <label className={labelClass}>Nom</label>
            <input name="label" defaultValue={asset.label} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Remplacer le fichier (optionnel)</label>
            <input
              name="file"
              type="file"
              accept="image/*,application/pdf,video/*"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          {state.error && <p className="text-xs text-err-600">{state.error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="btn-clay text-xs font-semibold px-3.5 py-1.5 disabled:opacity-60"
            >
              {pending ? "..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-medium text-ink-500 px-3 py-1.5"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="group relative">
      <a
        href={asset.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block glass ${cardPadding} rounded-card hover-lift`}
      >
        {cardBody}
      </a>

      {editable && (
        <div ref={menuRef} className="absolute top-2 right-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setMenuOpen((v) => !v);
            }}
            className="w-7 h-7 hidden group-hover:flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-ink-900 transition-colors"
            aria-label="Options du fichier"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="bg-[var(--paper)] border border-white/60 shadow-[0_20px_45px_-18px_rgba(23,22,26,0.45)] animate-pop-in absolute z-20 top-full right-0 mt-2 w-48 rounded-field overflow-hidden text-[13px]"
              onClick={stop}
            >
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  onSelectFromMenu(asset);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors"
              >
                Sélectionner
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/60 transition-colors border-t border-white/50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  onDelete(asset);
                }}
                disabled={isDeleting}
                className="w-full text-left px-3.5 py-2.5 text-err-600 hover:bg-err-100/70 transition-colors border-t border-white/50 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Grille des fichiers d'une section complémentaire. En mode agence (projectId
// fourni) : menu ⋮ par carte (sélectionner / modifier / supprimer) + sélection
// multiple avec suppression groupée. Lecture seule côté client (projectId
// absent). Le rendu s'adapte au template de la section (vidéos, interfaces
// Figma, mockups produit) ; sans template, on retombe sur la grille générique.
export function SectionAssetGrid({
  assets,
  projectId,
  projectSectionId,
  template = null,
  addSlot,
}: {
  assets: SectionAsset[];
  projectId?: string;
  projectSectionId?: string;
  template?: SectionTemplate | null;
  addSlot?: ReactNode;
}) {
  const editable = !!projectId;

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { type: "single"; asset: SectionAsset } | { type: "bulk" } | null
  >(null);

  function handleSelectFromMenu(asset: SectionAsset) {
    setSelectionMode(true);
    setSelected(new Set([asset.id]));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function handleDelete(asset: SectionAsset) {
    if (!projectId) return;
    setConfirmDelete({ type: "single", asset });
  }

  function handleBulkDelete() {
    if (!projectId || selected.size === 0) return;
    setConfirmDelete({ type: "bulk" });
  }

  function runConfirmedDelete() {
    if (!projectId || !confirmDelete) return;

    setError(null);
    startTransition(async () => {
      try {
        if (confirmDelete.type === "single") {
          const result = await deleteSectionAsset(confirmDelete.asset.id, projectId);
          if (result.error) setError(result.error);
        } else {
          const result = await deleteSectionAssets(Array.from(selected), projectId);
          if (result.error) {
            setError(result.error);
          } else {
            exitSelectionMode();
          }
        }
      } catch {
        setError("Une erreur est survenue, réessaie.");
      }
      setConfirmDelete(null);
    });
  }

  // Images et vidéos partagent désormais le même gabarit carré (voir
  // VideoAssetCard / genericPreview) : une seule grille pour tous les
  // templates garde une esthétique homogène.
  const gridColsClass = "grid-cols-4";

  return (
    <div>
      {editable && (
        <div className="flex items-center justify-between mb-4">
          {assets.length > 0 ? (
            <button
              type="button"
              onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
              className="text-sm font-medium text-ink-500 hover:text-clay-600"
            >
              {selectionMode ? "Annuler" : "Sélectionner"}
            </button>
          ) : (
            <span />
          )}

          {selectionMode ? (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="text-sm font-medium text-err-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isPending ? "Suppression..." : `Supprimer (${selected.size})`}
            </button>
          ) : (
            addSlot
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5 mb-4">{error}</p>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-ink-400">Aucun fichier pour l&apos;instant.</p>
      ) : (
        <ul className={`grid ${gridColsClass} gap-4`}>
          {assets.map((asset, index) => (
            <li key={asset.id}>
              <SectionAssetCard
                asset={asset}
                projectId={projectId ?? ""}
                projectSectionId={projectSectionId ?? ""}
                template={template}
                index={index}
                editable={editable}
                selectionMode={selectionMode}
                selected={selected.has(asset.id)}
                onToggleSelect={() => toggleSelect(asset.id)}
                onSelectFromMenu={handleSelectFromMenu}
                onDelete={handleDelete}
                isDeleting={isPending}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={
          confirmDelete?.type === "bulk"
            ? `Supprimer ${selected.size} fichier${selected.size > 1 ? "s" : ""} ?`
            : confirmDelete?.type === "single"
              ? `Supprimer "${confirmDelete.asset.label}" ?`
              : ""
        }
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isPending}
        onConfirm={runConfirmedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
