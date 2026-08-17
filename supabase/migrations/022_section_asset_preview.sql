-- Aperçu généré côté client pour les fichiers PDF déposés dans une section
-- complémentaire (même principe que generatedPreview sur les logos), afin
-- d'afficher une vraie miniature plutôt qu'une icône PDF générique.
alter table section_assets add column if not exists preview_url text;
