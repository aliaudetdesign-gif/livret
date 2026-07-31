// Conversions de couleur HEX <-> RGB <-> CMJN (CMYK). L'agence saisit une
// seule référence (HEX, RGB ou CMJN) et les deux autres représentations sont
// calculées automatiquement à partir de celle-ci.

import type { ColorInputFormat } from "@/lib/types";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export function normalizeHex(value: string): string {
  return `#${value.trim().replace(/^#/, "").toLowerCase()}`;
}

export function isValidRgbChannel(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 255;
}

export function isValidCmykChannel(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.trim().replace(/^#/, "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - rp - k) / (1 - k)) * 100),
    m: Math.round(((1 - gp - k) / (1 - k)) * 100),
    y: Math.round(((1 - bp - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cp = c / 100;
  const mp = m / 100;
  const yp = y / 100;
  const kp = k / 100;

  return {
    r: Math.round(255 * (1 - cp) * (1 - kp)),
    g: Math.round(255 * (1 - mp) * (1 - kp)),
    b: Math.round(255 * (1 - yp) * (1 - kp)),
  };
}

export interface ColorInput {
  hex?: string;
  r?: number;
  g?: number;
  b?: number;
  c?: number;
  m?: number;
  y?: number;
  k?: number;
}

export type ColorRepresentations = { hex: string; rgb: RGB; cmyk: CMYK };

// Construit les trois représentations (hex, rgb, cmyk) à partir d'une seule
// saisie de référence. Retourne une erreur explicite si la saisie est invalide.
export function buildColorRepresentations(
  format: ColorInputFormat,
  input: ColorInput
): ColorRepresentations | { error: string } {
  if (format === "hex") {
    const hex = input.hex ?? "";
    if (!isValidHex(hex)) {
      return { error: "Code HEX invalide (attendu : #RRGGBB)." };
    }
    const normalized = normalizeHex(hex);
    const rgb = hexToRgb(normalized);
    return { hex: normalized, rgb, cmyk: rgbToCmyk(rgb) };
  }

  if (format === "rgb") {
    const { r, g, b } = input;
    if (r === undefined || g === undefined || b === undefined || ![r, g, b].every(isValidRgbChannel)) {
      return { error: "Valeurs RGB invalides (attendu : 0 à 255)." };
    }
    const rgb = { r, g, b };
    return { hex: rgbToHex(rgb), rgb, cmyk: rgbToCmyk(rgb) };
  }

  const { c, m, y, k } = input;
  if (
    c === undefined ||
    m === undefined ||
    y === undefined ||
    k === undefined ||
    ![c, m, y, k].every(isValidCmykChannel)
  ) {
    return { error: "Valeurs CMJN invalides (attendu : 0 à 100)." };
  }
  const cmyk = { c, m, y, k };
  const rgb = cmykToRgb(cmyk);
  return { hex: rgbToHex(rgb), rgb, cmyk };
}
