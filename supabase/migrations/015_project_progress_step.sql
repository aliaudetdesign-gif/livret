-- Étape d'avancement du projet, indépendante du statut (en_cours / attente_validation / livre).
-- 0 = orientation, 1 = idéation, 2 = création, 3 = déploiement.
alter table projects
  add column progress_step smallint not null default 0
  check (progress_step between 0 and 3);
