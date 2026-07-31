-- Ajoute le brief structuré (prise de notes du premier rendez-vous) sur chaque
-- projet, et la policy permettant à l'agence de modifier un projet.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- Stocke les réponses aux questions pré-écrites de l'onglet "Infos"
-- (clé = identifiant du champ, valeur = réponse texte).
alter table projects add column if not exists brief jsonb not null default '{}'::jsonb;

-- Seule l'agence peut modifier un projet (nécessaire pour enregistrer le brief).
create policy "projects: agence peut modifier"
  on projects for update
  using (is_agence())
  with check (is_agence());
