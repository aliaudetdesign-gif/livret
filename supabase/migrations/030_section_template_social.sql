-- Ajoute un nouveau template de section complémentaire, disponible pour tous
-- les projets dans l'onglet "Voir les templates" de AddSectionForm :
-- "Réseaux sociaux". Même principe que les templates précédents (migrations
-- 021/024/027) : template non nul uniquement pour apparaître dans la liste
-- des templates, le rendu reste la grille générique de SectionAssetGrid (pas
-- de cas spécial). Images, PDF et vidéos ont déjà chacun un aperçu visuel
-- réel quel que soit le template (SectionAssetGrid + SectionAssetUploadForm),
-- donc aucun changement de rendu n'est nécessaire pour ce nouveau template.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

insert into section_types (key, label, icon, template)
values
  ('reseaux-sociaux', 'Réseaux sociaux', '📱', 'social')
on conflict (key) do nothing;
