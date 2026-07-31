-- Corbeille : suppression douce sur les 4 tables d'éléments de projet.
-- Une ligne avec deleted_at renseigné est considérée "dans la corbeille" :
-- elle disparaît des vues normales mais reste récupérable (restauration)
-- jusqu'à suppression définitive (qui, elle, retire aussi le fichier storage).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table brand_assets
  add column if not exists deleted_at timestamptz;

alter table project_documents
  add column if not exists deleted_at timestamptz;

alter table project_sections
  add column if not exists deleted_at timestamptz;

alter table section_assets
  add column if not exists deleted_at timestamptz;

-- La suppression douce passe par un update (deleted_at), il faut donc une
-- policy de mise à jour réservée à l'agence sur ces tables (les policies
-- de delete existantes ne couvrent pas ce cas). brand_assets a déjà cette
-- policy depuis la migration 009, pas besoin de la recréer ici.

create policy "project_documents: agence peut modifier"
  on project_documents for update
  using (is_agence())
  with check (is_agence());

create policy "project_sections: agence peut modifier"
  on project_sections for update
  using (is_agence())
  with check (is_agence());

create policy "section_assets: agence peut modifier"
  on section_assets for update
  using (is_agence())
  with check (is_agence());
