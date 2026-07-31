"use client";

import { useState } from "react";
import { AddTile } from "@/components/AddTile";
import { Modal } from "@/components/Modal";
import { AssetUploadForm } from "@/components/AssetUploadForm";
import type { AssetType } from "@/lib/types";

const tileLabels: Record<AssetType, { title: string; subtitle: string }> = {
  logo: { title: "Nouveau logo", subtitle: "Ajouter une nouvelle version" },
  couleur: { title: "Nouvelle couleur", subtitle: "Ajouter une couleur" },
  typographie: { title: "Nouvelle typographie", subtitle: "Ajouter une police" },
  moodboard: { title: "Nouveau visuel", subtitle: "Ajouter une image" },
};

// Tuile "+" qui ouvre le formulaire d'ajout d'un élément d'identité de marque
// (logo, couleur, typographie, moodboard) en pop-up.
export function AssetUploadTrigger({
  projectId,
  type,
}: {
  projectId: string;
  type: AssetType;
}) {
  const [open, setOpen] = useState(false);
  const { title, subtitle } = tileLabels[type];

  return (
    <>
      <AddTile
        title={title}
        subtitle={subtitle}
        variant={type === "typographie" ? "wide" : "square"}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <AssetUploadForm projectId={projectId} type={type} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
