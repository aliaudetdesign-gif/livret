-- Ajoute l'onglet "Administratif" : documents projet (devis, factures, brief)
-- partagés par l'agence, visibles par l'agence et le client concerné.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- Table des documents administratifs rattachés à un projet.
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  category text not null check (category in ('devis', 'facture', 'brief')),
  label text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table project_documents enable row level security;

-- Même logique de lecture que brand_assets : l'agence voit tout, le client
-- ne voit que les documents de son propre projet.
create policy "project_documents: agence voit tout"
  on project_documents for select
  using (is_agence());

create policy "project_documents: client voit les siens"
  on project_documents for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_documents.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

-- Seule l'agence dépose des documents.
create policy "project_documents: agence peut créer"
  on project_documents for insert
  with check (is_agence());

create policy "project_documents: agence peut supprimer"
  on project_documents for delete
  using (is_agence());

-- Bucket de stockage dédié. Public en lecture : agence et client doivent
-- pouvoir ouvrir/télécharger un PDF directement via son URL (cf. décision
-- prise pour l'onglet Administratif : accès direct des deux côtés).
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', true)
on conflict (id) do nothing;

create policy "project-documents: lecture publique"
  on storage.objects for select
  using (bucket_id = 'project-documents');

create policy "project-documents: agence peut uploader"
  on storage.objects for insert
  with check (bucket_id = 'project-documents' and is_agence());

create policy "project-documents: agence peut supprimer"
  on storage.objects for delete
  using (bucket_id = 'project-documents' and is_agence());
