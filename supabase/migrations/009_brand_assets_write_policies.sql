-- Ajoute les policies manquantes pour permettre à l'agence de modifier et
-- supprimer un brand_asset (logo, couleur, typographie, moodboard).
-- Jusqu'ici seules les policies select/insert existaient : impossible d'éditer
-- ou de supprimer une carte depuis l'app sans que la RLS ne bloque la requête.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

create policy "brand_assets: agence peut modifier"
  on brand_assets for update
  using (is_agence())
  with check (is_agence());

create policy "brand_assets: agence peut supprimer"
  on brand_assets for delete
  using (is_agence());
