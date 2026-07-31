-- Ajout d'une 5e étape d'avancement du projet : "Fin de projet".
-- 0 = orientation, 1 = idéation, 2 = création, 3 = déploiement, 4 = fin de projet.
alter table projects
  drop constraint if exists projects_progress_step_check;

alter table projects
  add constraint projects_progress_step_check check (progress_step between 0 and 4);
