-- Ajoute les policies DELETE manquantes sur project_sections et section_assets
-- pour permettre à l'agence de supprimer une section Compléments (et ses
-- fichiers) ou un fichier individuel d'une section. project_documents a déjà
-- sa policy delete (migration 011).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

create policy "project_sections: agence peut supprimer"
  on project_sections for delete
  using (is_agence());

create policy "section_assets: agence peut supprimer"
  on section_assets for delete
  using (is_agence());
