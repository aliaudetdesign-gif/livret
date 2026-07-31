-- Ajoute photo de profil et téléphone sur profiles, ouvre la mise à jour du
-- profil à tous les rôles (agence + client), et crée le bucket de stockage
-- pour les avatars.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table profiles
  add column if not exists avatar_url text,
  add column if not exists phone text;

-- La policy existante restreignait la mise à jour du profil à l'agence.
-- Mon profil concerne aussi les clients : on l'élargit à tout utilisateur
-- qui modifie sa propre ligne.
drop policy if exists "profiles: agence modifie son propre profil" on profiles;

create policy "profiles: chacun modifie son propre profil"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bucket public pour les avatars (affichage direct côté client, sans policy
-- de lecture particulière).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: lecture publique"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Chaque utilisateur upload/supprime uniquement dans son propre dossier
-- (chemin attendu : {user_id}/nom-du-fichier).
create policy "avatars: chacun upload son propre dossier"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: chacun supprime son propre dossier"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: chacun remplace son propre dossier"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
