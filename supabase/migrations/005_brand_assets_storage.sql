-- Bucket de stockage pour les fichiers de marque (logos, moodboards),
-- et policy d'écriture sur brand_assets pour l'agence (upload de fichiers/typographies).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- Bucket public : les images doivent être affichables directement côté client
-- (espace client) via une URL publique, sans passer par une policy de lecture.
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers du bucket (nécessaire pour afficher les images
-- côté client sans authentification particulière).
create policy "brand-assets: lecture publique"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

-- Seule l'agence peut uploader des fichiers dans ce bucket.
create policy "brand-assets: agence peut uploader"
  on storage.objects for insert
  with check (bucket_id = 'brand-assets' and is_agence());

-- Seule l'agence peut supprimer un fichier (utile si on ajoute la suppression plus tard).
create policy "brand-assets: agence peut supprimer"
  on storage.objects for delete
  using (bucket_id = 'brand-assets' and is_agence());

-- L'agence peut ajouter des éléments de marque (logo, typographie, moodboard, couleur)
-- à un projet.
create policy "brand_assets: agence peut créer"
  on brand_assets for insert
  with check (is_agence());
