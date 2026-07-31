-- Ajoute l'onglet "Design" : grille Essentiel (logos/couleurs/typographies/
-- visuels) + grille Compléments (sections libres, réutilisables entre projets,
-- ex: illustrations, motifs, mockups...).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- Bibliothèque partagée des types de sections complémentaires (réutilisable
-- d'un projet à l'autre, ex: "Illustrations", "Motifs"...).
create table if not exists section_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  icon text not null default '📁',
  created_at timestamptz not null default now()
);

-- Sections complémentaires activées sur un projet donné (instance d'un
-- section_type sur un projet précis).
create table if not exists project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  section_type_id uuid not null references section_types (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, section_type_id)
);

-- Documents déposés dans une section complémentaire (PNG, SVG, PDF...).
create table if not exists section_assets (
  id uuid primary key default gen_random_uuid(),
  project_section_id uuid not null references project_sections (id) on delete cascade,
  label text not null,
  file_url text not null,
  file_type text not null,
  created_at timestamptz not null default now()
);

alter table section_types enable row level security;
alter table project_sections enable row level security;
alter table section_assets enable row level security;

-- section_types : simple bibliothèque de labels/icônes, lisible par tout
-- utilisateur connecté (agence ou client), gérée uniquement par l'agence.
create policy "section_types: lecture authentifiée"
  on section_types for select
  using (auth.uid() is not null);

create policy "section_types: agence peut créer"
  on section_types for insert
  with check (is_agence());

-- project_sections : même logique que les autres tables projet.
create policy "project_sections: agence voit tout"
  on project_sections for select
  using (is_agence());

create policy "project_sections: client voit les siennes"
  on project_sections for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_sections.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

create policy "project_sections: agence peut créer"
  on project_sections for insert
  with check (is_agence());

-- section_assets : visibilité via la section complémentaire -> le projet.
create policy "section_assets: agence voit tout"
  on section_assets for select
  using (is_agence());

create policy "section_assets: client voit les siens"
  on section_assets for select
  using (
    exists (
      select 1 from project_sections
      join projects on projects.id = project_sections.project_id
      where project_sections.id = section_assets.project_section_id
      and projects.client_profile_id = auth.uid()
    )
  );

create policy "section_assets: agence peut créer"
  on section_assets for insert
  with check (is_agence());

-- Bucket de stockage dédié aux documents des sections complémentaires.
insert into storage.buckets (id, name, public)
values ('project-sections', 'project-sections', true)
on conflict (id) do nothing;

create policy "project-sections: lecture publique"
  on storage.objects for select
  using (bucket_id = 'project-sections');

create policy "project-sections: agence peut uploader"
  on storage.objects for insert
  with check (bucket_id = 'project-sections' and is_agence());

create policy "project-sections: agence peut supprimer"
  on storage.objects for delete
  using (bucket_id = 'project-sections' and is_agence());
