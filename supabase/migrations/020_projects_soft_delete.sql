-- Étend la Corbeille (voir migration 018) aux projets eux-mêmes : un projet
-- supprimé passe par deleted_at (récupérable) plutôt qu'un delete direct.
-- La policy update existante (migration 006, "projects: agence peut modifier")
-- couvre déjà la mise à jour de deleted_at ; il manque en revanche une policy
-- delete pour la suppression définitive depuis la corbeille.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table projects
  add column if not exists deleted_at timestamptz;

create policy "projects: agence peut supprimer définitivement"
  on projects for delete
  using (is_agence());
