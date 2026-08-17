-- Ajoute deux nouveaux templates de section complémentaire, disponibles pour
-- tous les projets dans l'onglet "Voir les templates" de AddSectionForm :
-- "Illustrations" et "Packaging". Même principe que "Visuels & Moodboard"
-- (migration 024) : template non nul uniquement pour apparaître dans la
-- liste des templates (AddSectionForm filtre sur template non-nul), le rendu
-- reste la grille générique de SectionAssetGrid (pas de cas spécial, comme
-- pour mockup/moodboard). Le choix "fichier unique / plusieurs formats"
-- (PDF/PNG/SVG/AI/EPS...) est déjà disponible à l'ajout d'un fichier dans
-- n'importe quelle section, voir SectionAssetUploadForm (migration 026).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

insert into section_types (key, label, icon, template)
values
  ('illustrations', 'Illustrations', '🎨', 'illustrations'),
  ('packaging', 'Packaging', '📦', 'packaging')
on conflict (key) do nothing;
