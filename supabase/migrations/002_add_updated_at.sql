-- Ajoute le suivi de dernière mise à jour sur les projets (champ "MAJ." du dashboard)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table projects
  add column updated_at timestamptz not null default now();

-- La colonne démarre alignée sur created_at pour les projets existants
update projects set updated_at = created_at;

-- Fonction générique : met à jour updated_at à chaque modification de ligne
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on projects
  for each row
  execute function set_updated_at();
