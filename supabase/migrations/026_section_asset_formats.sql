-- Permet à un fichier de section complémentaire (section_assets) de porter
-- plusieurs formats (PDF/PNG/SVG + formats supplémentaires libres), sur le
-- même principe que les logos (brand_assets.metadata / LogoMetadata). Champ
-- optionnel : null pour un fichier simple (comportement actuel inchangé),
-- rempli uniquement quand le designer choisit le mode "Plusieurs formats" à
-- l'ajout (voir SectionAssetUploadForm).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table section_assets add column if not exists metadata jsonb;
