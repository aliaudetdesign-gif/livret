"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { addBrandAsset, type AssetActionState } from "@/app/agence/projets/[id]/actions";
import { ExtraFormatFields } from "@/components/ExtraFormatFields";
import { InfoPopover } from "@/components/InfoPopover";
import { FontFilesField, type PendingFontFile } from "@/components/FontFilesField";
import { generatePdfPreview } from "@/lib/pdfPreview";
import {
  COLOR_FORMAT_DESCRIPTIONS,
  LOGO_FORMAT_DESCRIPTIONS,
  type AssetType,
  type ColorCategory,
  type ColorInputFormat,
  type LogoBackground,
  type TypographyCategory,
} from "@/lib/types";

const initialState: AssetActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

const FILE_TYPES: AssetType[] = ["logo", "moodboard"];

const labels: Record<AssetType, { title: string; namePlaceholder: string }> = {
  logo: { title: "Ajouter un logo", namePlaceholder: "ex: Logo principal" },
  moodboard: { title: "Ajouter une image", namePlaceholder: "ex: Ambiance été" },
  typographie: { title: "Ajouter une typographie", namePlaceholder: "ex: Cormorant Infant" },
  couleur: { title: "Ajouter une couleur", namePlaceholder: "ex: Terracotta" },
  guide: { title: "Ajouter un PDF", namePlaceholder: "ex: Guide de la charte graphique" },
};

const typographyCategories: { value: TypographyCategory; label: string }[] = [
  { value: "titrage", label: "Titrage" },
  { value: "corps_de_texte", label: "Corps de texte" },
  { value: "accent", label: "Accent / Labels" },
];

const logoBackgrounds: { value: LogoBackground; label: string }[] = [
  { value: "dark", label: "Fond sombre" },
  { value: "light", label: "Fond clair" },
  { value: "color", label: "Fond couleur" },
];

const colorCategories: { value: ColorCategory; label: string }[] = [
  { value: "primaire", label: "Couleur primaire" },
  { value: "secondaire", label: "Couleur secondaire" },
];

const colorFormats: { value: ColorInputFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGB" },
  { value: "cmyk", label: "CMJN" },
];

export function AssetUploadForm({
  projectId,
  type,
  onSuccess,
}: {
  projectId: string;
  type: AssetType;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addBrandAsset, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [colorFormat, setColorFormat] = useState<ColorInputFormat>("hex");
  const [fontFiles, setFontFiles] = useState<PendingFontFile[]>([]);
  const weightsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setColorFormat("hex");
      setFontFiles([]);
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  // Pré-remplit "Graisses disponibles" avec les graisses détectées dans les
  // fichiers joints, tout en laissant le champ modifiable à la main ensuite.
  useEffect(() => {
    if (fontFiles.length === 0 || !weightsInputRef.current) return;
    const detected = fontFiles.filter((f) => !f.detecting).map((f) => f.weight);
    if (detected.length > 0) {
      weightsInputRef.current.value = detected.join(", ");
    }
  }, [fontFiles]);

  const isFile = FILE_TYPES.includes(type);
  const isTypography = type === "typographie";
  const { title, namePlaceholder } = labels[type];

  // Cas logo déposé uniquement en PDF (pas de SVG/PNG) : on intercepte la
  // soumission pour générer un aperçu côté navigateur avant d'envoyer le
  // formulaire, afin que la carte logo puisse afficher une image plutôt
  // qu'une icône PDF générique.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (type === "typographie") {
      if (fontFiles.length === 0) return; // rien à ajouter, soumission normale

      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      fontFiles.forEach((entry, i) => {
        formData.append(`font_file_${i}`, entry.file);
        formData.append(`font_weight_${i}`, entry.weight || "Regular");
      });

      startTransition(() => {
        formAction(formData);
      });
      return;
    }

    if (type === "guide") {
      // Le guide est toujours un PDF : on génère systématiquement un aperçu
      // de sa première page côté navigateur, comme pour un logo déposé
      // uniquement en PDF.
      const form = e.currentTarget;
      const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
      if (!file) return;

      e.preventDefault();
      const formData = new FormData(form);

      const previewBlob = await generatePdfPreview(file);
      if (previewBlob) {
        formData.append("pdf_preview_file", previewBlob, "preview.png");
      }

      startTransition(() => {
        formAction(formData);
      });
      return;
    }

    if (type !== "logo") return;

    const form = e.currentTarget;
    const svgFile = (form.elements.namedItem("svg_file") as HTMLInputElement | null)?.files?.[0];
    const pngFile = (form.elements.namedItem("png_file") as HTMLInputElement | null)?.files?.[0];
    const pdfFile = (form.elements.namedItem("pdf_file") as HTMLInputElement | null)?.files?.[0];

    if (svgFile || pngFile || !pdfFile) return;

    e.preventDefault();
    const formData = new FormData(form);

    const previewBlob = await generatePdfPreview(pdfFile);
    if (previewBlob) {
      formData.append("pdf_preview_file", previewBlob, "preview.png");
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="glass rounded-card p-4 max-w-md flex flex-col gap-3 mb-6"
    >
      <p className="text-sm font-medium">{title}</p>

      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="type" value={type} />

      <div>
        <label htmlFor={`${type}-label`} className={labelClass}>
          {isTypography ? "Nom de la police *" : "Nom *"}
        </label>
        <input
          id={`${type}-label`}
          name="label"
          required
          className={inputClass}
          placeholder={namePlaceholder}
        />
      </div>

      {isTypography ? (
        <>
          <div>
            <label htmlFor="typographie-category" className={labelClass}>
              Catégorie *
            </label>
            <select
              id="typographie-category"
              name="category"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Choisir...
              </option>
              {typographyCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="typographie-source" className={labelClass}>
              Source
            </label>
            <input
              id="typographie-source"
              name="source"
              className={inputClass}
              placeholder="ex: Google Fonts - Libre, Système..."
            />
          </div>

          <div>
            <label htmlFor="typographie-preview-text" className={labelClass}>
              Texte d&apos;aperçu *
            </label>
            <input
              id="typographie-preview-text"
              name="preview_text"
              required
              className={inputClass}
              placeholder="ex: L'art de vivre à la française"
            />
          </div>

          <div>
            <label htmlFor="typographie-preview-subtext" className={labelClass}>
              Texte d&apos;aperçu secondaire
            </label>
            <input
              id="typographie-preview-subtext"
              name="preview_subtext"
              className={inputClass}
              placeholder="ex: Élégance & authenticité"
            />
          </div>

          <div>
            <label htmlFor="typographie-weights" className={labelClass}>
              Graisses disponibles
            </label>
            <input
              id="typographie-weights"
              name="weights"
              ref={weightsInputRef}
              className={inputClass}
              placeholder="ex: Regular, SemiBold, Bold, Italic"
            />
          </div>

          <FontFilesField
            entries={fontFiles}
            onChange={setFontFiles}
            idPrefix="typographie-add"
          />
        </>
      ) : type === "logo" ? (
        <>
          <div>
            <label htmlFor="logo-background" className={labelClass}>
              Fond *
            </label>
            <select
              id="logo-background"
              name="background"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Choisir...
              </option>
              {logoBackgrounds.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="logo-subtitle" className={labelClass}>
              Sous-titre
            </label>
            <input
              id="logo-subtitle"
              name="subtitle"
              className={inputClass}
              placeholder="ex: Version couleur"
            />
          </div>

          <p className="text-xs text-ink-500 -mb-1">
            Dépose au moins un format (SVG, PNG ou PDF).
          </p>

          <div>
            <label htmlFor="logo-svg-file" className={labelClass}>
              <InfoPopover text={LOGO_FORMAT_DESCRIPTIONS.svg}>Fichier SVG</InfoPopover>
            </label>
            <input
              id="logo-svg-file"
              name="svg_file"
              type="file"
              accept=".svg,image/svg+xml"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <div>
            <label htmlFor="logo-png-file" className={labelClass}>
              <InfoPopover text={LOGO_FORMAT_DESCRIPTIONS.png}>Fichier PNG</InfoPopover>
            </label>
            <input
              id="logo-png-file"
              name="png_file"
              type="file"
              accept="image/png"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <div>
            <label htmlFor="logo-pdf-file" className={labelClass}>
              <InfoPopover text={LOGO_FORMAT_DESCRIPTIONS.pdf}>Fichier PDF</InfoPopover>
            </label>
            <input
              id="logo-pdf-file"
              name="pdf_file"
              type="file"
              accept="application/pdf"
              className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
            />
          </div>

          <ExtraFormatFields />
        </>
      ) : type === "couleur" ? (
        <>
          <div>
            <label htmlFor="color-category" className={labelClass}>
              Catégorie *
            </label>
            <select
              id="color-category"
              name="color_category"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Choisir...
              </option>
              {colorCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="color-format" className={labelClass}>
              <InfoPopover text={COLOR_FORMAT_DESCRIPTIONS[colorFormat]}>Format de saisie *</InfoPopover>
            </label>
            <select
              id="color-format"
              name="color_format"
              required
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
            <p className="text-[11px] text-ink-400 mt-1">
              Les autres codes seront calculés automatiquement à partir de celui-ci.
            </p>
          </div>

          {colorFormat === "hex" ? (
            <div>
              <label htmlFor="color-hex" className={labelClass}>
                Code HEX *
              </label>
              <input
                id="color-hex"
                name="hex_value"
                required
                className={inputClass}
                placeholder="ex: #C97C5D"
              />
            </div>
          ) : colorFormat === "rgb" ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="color-rgb-r" className={labelClass}>
                  R
                </label>
                <input
                  id="color-rgb-r"
                  name="rgb_r"
                  type="number"
                  min={0}
                  max={255}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="color-rgb-g" className={labelClass}>
                  G
                </label>
                <input
                  id="color-rgb-g"
                  name="rgb_g"
                  type="number"
                  min={0}
                  max={255}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="color-rgb-b" className={labelClass}>
                  B
                </label>
                <input
                  id="color-rgb-b"
                  name="rgb_b"
                  type="number"
                  min={0}
                  max={255}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label htmlFor="color-cmyk-c" className={labelClass}>
                  C
                </label>
                <input
                  id="color-cmyk-c"
                  name="cmyk_c"
                  type="number"
                  min={0}
                  max={100}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="color-cmyk-m" className={labelClass}>
                  M
                </label>
                <input
                  id="color-cmyk-m"
                  name="cmyk_m"
                  type="number"
                  min={0}
                  max={100}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="color-cmyk-y" className={labelClass}>
                  J
                </label>
                <input
                  id="color-cmyk-y"
                  name="cmyk_y"
                  type="number"
                  min={0}
                  max={100}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="color-cmyk-k" className={labelClass}>
                  N
                </label>
                <input
                  id="color-cmyk-k"
                  name="cmyk_k"
                  type="number"
                  min={0}
                  max={100}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </>
      ) : type === "guide" ? (
        <div>
          <label htmlFor="guide-file" className={labelClass}>
            Fichier PDF *
          </label>
          <input
            id="guide-file"
            name="file"
            type="file"
            accept="application/pdf"
            required
            className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
          />
        </div>
      ) : isFile ? (
        <div>
          <label htmlFor={`${type}-file`} className={labelClass}>
            Fichier image *
          </label>
          <input
            id={`${type}-file`}
            name="file"
            type="file"
            accept="image/*"
            required
            className={`${inputClass} file:mr-3 file:py-1 file:px-2 file:rounded-chip file:border-0 file:text-xs file:bg-white/65 file:text-ink-700`}
          />
        </div>
      ) : (
        <div>
          <label htmlFor={`${type}-value`} className={labelClass}>
            Valeur *
          </label>
          <input id={`${type}-value`} name="value" required className={inputClass} />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start btn-clay text-sm font-semibold px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
