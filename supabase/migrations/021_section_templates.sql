-- Ajoute la notion de "template" sur les sections complémentaires (Design),
-- pour permettre un rendu spécifique (vidéo, interfaces Figma, mockups) au
-- lieu de la grille générique. Seed les 3 premiers templates disponibles.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table section_types
  add column if not exists template text;

insert into section_types (key, label, icon, template)
values
  ('videos', 'Vidéos', '🎬', 'video'),
  ('interfaces-figma', 'Interfaces Figma', '🖥️', 'figma'),
  ('mockups-produit', 'Mockups produit', '📱', 'mockup')
on conflict (key) do nothing;
