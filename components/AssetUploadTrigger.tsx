"use client";

import { useState } from "react";
import { AddTile } from "@/components/AddTile";
import { Modal } from "@/components/Modal";
import { AssetUploadForm } from "@/components/AssetUploadForm";
import type { AssetType } from "@/lib/types";

const pillLabels: Record<AssetType, string> = {
  logo: "Nouveau logo",
  couleur: "Nouvelle couleur",
  typographie: "Nouvelle typographie",
  moodboard: "Nouveau visuel",
  guide: "Nouveau guide",
};

// Bouton "+" (pilule, dans la barre du haut de la grille) qui ouvre le
// formulaire d'ajout d'un élément d'identité de marque (logo, couleur,
// typographie, moodboard) en pop-up.
export function AssetUploadTrigger({
  projectId,
  type,
}: {
  projectId: string;
  type: AssetType;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddTile title={pillLabels[type]} variant="pill" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)}>
        <AssetUploadForm projectId={projectId} type={type} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
