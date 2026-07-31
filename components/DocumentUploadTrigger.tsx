"use client";

import { useState } from "react";
import { AddTile } from "@/components/AddTile";
import { Modal } from "@/components/Modal";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";

// Tuile "+" qui ouvre le formulaire d'ajout d'un document administratif en pop-up.
export function DocumentUploadTrigger({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddTile title="Ajouter un document" variant="row" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)}>
        <DocumentUploadForm projectId={projectId} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
