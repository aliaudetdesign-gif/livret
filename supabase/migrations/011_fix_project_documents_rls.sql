-- Correctif : "new row violates row-level security policy" lors de l'ajout
-- d'un document dans l'onglet Administratif. Recrée proprement le bucket
-- project-documents et toutes les policies concernées (table + storage), au
-- cas où la migration 007 aurait été exécutée partiellement.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- S'assure que le bucket existe et qu'il est public en lecture.
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', true)
on conflict (id) do update set public = true;

-- Table project_documents : on repart de zéro sur les policies pour éviter
-- tout état incohérent (policy manquante ou obsolète).
drop policy if exists "project_documents: agence voit tout" on project_documents;
drop policy if exists "project_documents: client voit les siens" on project_documents;
drop policy if exists "project_documents: agence peut créer" on project_documents;
drop policy if exists "project_documents: agence peut supprimer" on project_documents;

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

create policy "project_documents: agence peut créer"
  on project_documents for insert
  with check (is_agence());

create policy "project_documents: agence peut supprimer"
  on project_documents for delete
  using (is_agence());

-- Storage project-documents : même remise à zéro des policies.
drop policy if exists "project-documents: lecture publique" on storage.objects;
drop policy if exists "project-documents: agence peut uploader" on storage.objects;
drop policy if exists "project-documents: agence peut supprimer" on storage.objects;

create policy "project-documents: lecture publique"
  on storage.objects for select
  using (bucket_id = 'project-documents');

create policy "project-documents: agence peut uploader"
  on storage.objects for insert
  with check (bucket_id = 'project-documents' and is_agence());

create policy "project-documents: agence peut supprimer"
  on storage.objects for delete
  using (bucket_id = 'project-documents' and is_agence());
