"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  updateBrandAsset,
  deleteBrandAsset,
  type AssetActionState,
} from "@/app/agence/projets/[id]/actions";
import { COLOR_FORMAT_DESCRIPTIONS, type BrandAsset, type ColorCategory, type ColorInputFormat, type ColorMetadata } from "@/lib/types";
import { InfoPopover } from "@/components/InfoPopover";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const initialState: AssetActionState = { error: null };

const inputClass =
  "w-full px-2.5 py-1.5 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1";

const colorCategories: { value: ColorCategory; label: string }[] = [
  { value: "primaire", label: "Couleur primaire" },
  { value: "secondaire", label: "Couleur secondaire" },
];

const colorFormats: { value: ColorInputFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGB" },
  { value: "cmyk", label: "CMJN" },
];

// Carte d'une couleur de la palette : swatch plein, nom, codes HEX/RGB/CMJN
// (copie du hex au clic sur le swatch). En mode agence (projectId fourni) :
// édition en direct (catégorie + nouvelle saisie de référence dans le format
// de son choix) et suppression. Filet de sécurité pour les couleurs créées
// avant l'ajout des métadonnées RGB/CMJN (metadata absente).
export function ColorCard({
  asset,
  projectId,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  asset: BrandAsset;
  projectId?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const metadata = asset.metadata as unknown as ColorMetadata | null;
  const editable = !!projectId;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [colorFormat, setColorFormat] = useState<ColorInputFormat>("hex");
  const [state, formAction, pending] = useActionState(updateBrandAsset, initialState);
  const wasPending = useRef(false);

  const [isDeleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function handleCopy() {
    navigator.clipboard.writeText(asset.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleDelete() {
    if (!projectId) return;
    setConfirmOpen(true);
  }

  function runDelete() {
    if (!projectId) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        const result = await deleteBrandAsset(asset.id, projectId);
        if (result.error) setDeleteError(result.error);
      } catch {
        setDeleteError("Une erreur est survenue, réessaie.");
      }
      setConfirmOpen(false);
    });
  }

  return (
    <div className="glass hover-lift group relative rounded-card overflow-hidden">
      {selectionMode ? (
        <label className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-4 h-4 accent-clay-500"
          />
        </label>
      ) : (
        editable &&
        !isEditing && (
          <div className="absolute top-3 right-3 z-10 hidden group-hover:flex gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-clay-600 transition-colors"
              title="Modifier"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 flex items-center justify-center rounded-chip bg-white/85 border border-white/60 text-ink-500 hover:text-err-600 transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        )
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={handleCopy}
          className="h-[86px] w-full block border-b border-white/40"
          style={{ backgroundColor: asset.value }}
          title="Cliquer pour copier le code hexadécimal"
        />
      )}

      <div className="p-3">
        {isEditing ? (
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="asset_id" value={asset.id} />
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="type" value="couleur" />

            <div>
              <label className={labelClass}>Nom</label>
              <input name="label" defaultValue={asset.label} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Catégorie</label>
              <select
                name="color_category"
                defaultValue={metadata?.category ?? "primaire"}
                required
                className={inputClass}
              >
                {colorCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Format de saisie</label>
              <select
                name="color_format"
                value={colorFormat}
                onChange={(e) => setColorFormat(e.target.value as ColorInputFormat)}
                className={inputClass}
              >
                {colorFormats.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {colorFormat === "hex" ? (
              <div>
                <label className={labelClass}>Code HEX</label>
                <input name="hex_value" defaultValue={asset.value} required className={inputClass} />
              </div>
            ) : colorFormat === "rgb" ? (
              <div className="grid grid-cols-3 gap-2">
                <input
                  name="rgb_r"
                  type="number"
                  min={0}
                  max={255}
                  defaultValue={metadata?.rgb.r}
                  required
                  placeholder="R"
                  className={inputClass}
                />
                <input
                  name="rgb_g"
                  type="number"
                  min={0}
                  max={255}
                  defaultValue={metadata?.rgb.g}
                  required
                  placeholder="G"
                  className={inputClass}
                />
                <input
                  name="rgb_b"
                  type="number"
                  min={0}
                  max={255}
                  defaultValue={metadata?.rgb.b}
                  required
                  placeholder="B"
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <input
                  name="cmyk_c"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={metadata?.cmyk.c}
                  required
                  placeholder="C"
                  className={inputClass}
                />
                <input
                  name="cmyk_m"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={metadata?.cmyk.m}
                  required
                  placeholder="M"
                  className={inputClass}
                />
                <input
                  name="cmyk_y"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={metadata?.cmyk.y}
                  required
                  placeholder="J"
                  className={inputClass}
                />
                <input
                  name="cmyk_k"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={metadata?.cmyk.k}
                  required
                  placeholder="N"
                  className={inputClass}
                />
              </div>
            )}

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
                className="text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors px-3 py-1.5"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="font-semibold text-[13.5px]">{asset.label}</div>
            <div className="text-xs text-ink-500 mt-1 flex items-center flex-wrap gap-y-1">
              {copied ? "Copié !" : asset.value}
              {!copied && <InfoPopover text={COLOR_FORMAT_DESCRIPTIONS.hex} />}
            </div>
            {metadata && (
              <div className="text-[11px] text-ink-400 mt-1 leading-relaxed">
                <div className="flex items-center flex-wrap gap-y-1">
                  RGB {metadata.rgb.r}, {metadata.rgb.g}, {metadata.rgb.b}
                  <InfoPopover text={COLOR_FORMAT_DESCRIPTIONS.rgb} />
                </div>
                <div className="flex items-center flex-wrap gap-y-1">
                  CMJN {metadata.cmyk.c}, {metadata.cmyk.m}, {metadata.cmyk.y}, {metadata.cmyk.k}
                  <InfoPopover text={COLOR_FORMAT_DESCRIPTIONS.cmyk} />
                </div>
              </div>
            )}
          </>
        )}

        {deleteError && <p className="text-xs text-err-600 mt-2">{deleteError}</p>}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Supprimer "${asset.label}" ?`}
        message="Récupérable depuis la Corbeille en cas d'erreur."
        pending={isDeleting}
        onConfirm={runDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
