"use client";

import { useState } from "react";
import { AddTile } from "@/components/AddTile";
import { Modal } from "@/components/Modal";
import { SectionAssetUploadForm } from "@/components/SectionAssetUploadForm";

// Tuile "+" qui ouvre le formulaire d'ajout d'un fichier de section complémentaire en pop-up.
export function SectionAssetUploadTrigger({
  projectId,
  projectSectionId,
}: {
  projectId: string;
  projectSectionId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddTile title="Ajouter un fichier" variant="pill" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)}>
        <SectionAssetUploadForm
          projectId={projectId}
          projectSectionId={projectSectionId}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
