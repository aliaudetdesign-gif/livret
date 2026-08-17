-- Bascule "Visuels & Moodboard" d'une section Essentiel (brand_assets, type
-- fixe) vers une section Compléments (section_types / project_sections /
-- section_assets, système dynamique). Objectif : ne garder que 4 cartes
-- Essentiel (logo, couleur, typographie, guide) pour qu'elles tiennent sur
-- une seule ligne, et rendre "Visuels & Moodboard" disponible comme modèle
-- de complément réutilisable sur tous les projets.
--
-- Important : les lignes brand_assets d'origine (type='moodboard') ne sont
-- ni supprimées ni soft-deleted par cette migration. Elles restent en base
-- intactes, uniquement pour ne pas casser le fichier physique dans le bucket
-- "brand-assets" que les nouvelles lignes section_assets continuent de
-- référencer (même file_url). Le nettoyage définitif de ces lignes orphelines
-- pourra se faire plus tard, une fois qu'on aura la certitude que la
-- migration s'est bien déroulée pour tous les projets concernés.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- 1. Nouveau type de section complémentaire, disponible pour tous les
-- projets (comme "Vidéos", "Interfaces Figma"...). template='moodboard'
-- uniquement pour qu'elle apparaisse dans l'onglet "Voir les templates" de
-- AddSectionForm (qui filtre sur template non-nul) ; le rendu reste la
-- grille générique (SectionAssetGrid se base sur file_type, pas sur
-- section_types.template, sauf cas spécial "figma").
insert into section_types (key, label, icon, template)
values ('visuels-moodboard', 'Visuels & Moodboard', '📷', 'moodboard')
on conflict (key) do nothing;

-- 2. Active la section "Visuels & Moodboard" sur chaque projet qui a déjà
-- des assets moodboard (non supprimés), pour pouvoir y rattacher la copie.
insert into project_sections (project_id, section_type_id)
select distinct ba.project_id, st.id
from brand_assets ba
cross join (select id from section_types where key = 'visuels-moodboard') st
where ba.type = 'moodboard'
  and ba.deleted_at is null
on conflict (project_id, section_type_id) do nothing;

-- 3. Copie chaque asset moodboard existant vers section_assets, rattaché à
-- la project_section créée à l'étape précédente. file_type est fixé à
-- "image/*" générique : c'est uniquement ce préfixe qui compte pour le
-- rendu (SectionAssetGrid), pas le type MIME exact d'origine (non stocké
-- sur brand_assets).
insert into section_assets (project_section_id, label, file_url, file_type, created_at)
select
  ps.id,
  ba.label,
  ba.value,
  'image/*',
  ba.created_at
from brand_assets ba
join section_types st on st.key = 'visuels-moodboard'
join project_sections ps on ps.project_id = ba.project_id and ps.section_type_id = st.id
where ba.type = 'moodboard'
  and ba.deleted_at is null
  -- Idempotence si la migration est relancée : évite les doublons en
  -- comparant sur (project_section_id, file_url).
  and not exists (
    select 1 from section_assets sa
    where sa.project_section_id = ps.id
      and sa.file_url = ba.value
  );
