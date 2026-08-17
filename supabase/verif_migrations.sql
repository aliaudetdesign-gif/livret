-- Diagnostic en lecture seule : ne modifie rien, liste ce qui manque en base
-- par rapport aux fichiers du dossier supabase/migrations/.
-- À coller dans Supabase : Dashboard > SQL Editor > New query > Run

select migration, item, case when ok then 'OK' else 'MANQUANT' end as etat
from (
  values
    ('002', 'colonne projects.updated_at',
      exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'updated_at')),

    ('003', 'fonction is_agence()',
      exists (select 1 from pg_proc where proname = 'is_agence')),
    ('003', 'policy projects: agence peut créer',
      exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'projects: agence peut créer')),

    ('004', 'policy projects: agence peut modifier',
      exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'projects: agence peut modifier')),
    ('004', 'policy messages: agence peut écrire',
      exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'messages: agence peut écrire')),

    ('005', 'bucket brand-assets',
      exists (select 1 from storage.buckets where id = 'brand-assets')),

    ('006', 'colonne projects.brief',
      exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'brief')),

    ('007', 'table project_documents',
      exists (select 1 from information_schema.tables where table_name = 'project_documents')),
    ('007', 'bucket project-documents',
      exists (select 1 from storage.buckets where id = 'project-documents')),

    ('008', 'table project_sections',
      exists (select 1 from information_schema.tables where table_name = 'project_sections')),
    ('008', 'table section_assets',
      exists (select 1 from information_schema.tables where table_name = 'section_assets')),
    ('008', 'bucket project-sections',
      exists (select 1 from storage.buckets where id = 'project-sections')),

    ('009', 'policy brand_assets: agence peut modifier',
      exists (select 1 from pg_policies where tablename = 'brand_assets' and policyname = 'brand_assets: agence peut modifier')),
    ('009', 'policy brand_assets: agence peut supprimer',
      exists (select 1 from pg_policies where tablename = 'brand_assets' and policyname = 'brand_assets: agence peut supprimer')),

    ('010', 'table subscription',
      exists (select 1 from information_schema.tables where table_name = 'subscription')),
    ('010', 'table agency_invites',
      exists (select 1 from information_schema.tables where table_name = 'agency_invites')),

    ('011', 'policy project_documents: agence peut créer',
      exists (select 1 from pg_policies where tablename = 'project_documents' and policyname = 'project_documents: agence peut créer')),

    ('012', 'policy project_sections: agence peut supprimer',
      exists (select 1 from pg_policies where tablename = 'project_sections' and policyname = 'project_sections: agence peut supprimer')),
    ('012', 'policy section_assets: agence peut supprimer',
      exists (select 1 from pg_policies where tablename = 'section_assets' and policyname = 'section_assets: agence peut supprimer')),

    ('013', 'table project_client_invites',
      exists (select 1 from information_schema.tables where table_name = 'project_client_invites')),

    ('014', 'colonne projects.description',
      exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'description')),

    ('015', 'colonne projects.progress_step',
      exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'progress_step')),

    ('016', 'contrainte progress_step 0-4',
      exists (select 1 from pg_constraint where conname = 'projects_progress_step_check')),

    ('017', 'colonne profiles.avatar_url',
      exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'avatar_url')),
    ('017', 'colonne profiles.phone',
      exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'phone')),
    ('017', 'bucket avatars',
      exists (select 1 from storage.buckets where id = 'avatars')),

    ('018', 'colonne brand_assets.deleted_at',
      exists (select 1 from information_schema.columns where table_name = 'brand_assets' and column_name = 'deleted_at')),
    ('018', 'colonne project_documents.deleted_at',
      exists (select 1 from information_schema.columns where table_name = 'project_documents' and column_name = 'deleted_at')),
    ('018', 'colonne project_sections.deleted_at',
      exists (select 1 from information_schema.columns where table_name = 'project_sections' and column_name = 'deleted_at')),
    ('018', 'colonne section_assets.deleted_at',
      exists (select 1 from information_schema.columns where table_name = 'section_assets' and column_name = 'deleted_at')),

    ('019', 'colonne profiles.notify_new_message',
      exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'notify_new_message')),
    ('019', 'colonne profiles.notify_new_document',
      exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'notify_new_document')),
    ('019', 'colonne profiles.professional_link',
      exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'professional_link')),

    ('020', 'colonne projects.deleted_at',
      exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'deleted_at')),
    ('020', 'policy projects: agence peut supprimer définitivement',
      exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'projects: agence peut supprimer définitivement'))
) as t(migration, item, ok)
order by migration, item;
