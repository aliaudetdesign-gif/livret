-- Correctif : la migration 024 a été exécutée une première fois avec
-- template=null (avant l'ajustement demandé pour que "Visuels & Moodboard"
-- apparaisse dans l'onglet "Voir les templates" comme les autres modèles).
-- Comme l'insert de la 024 utilise "on conflict (key) do nothing", relancer
-- le fichier corrigé n'a pas mis à jour la ligne déjà existante. Ce correctif
-- force la valeur, sans condition sur l'état actuel (idempotent, sans risque
-- à rejouer).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

update section_types
set template = 'moodboard'
where key = 'visuels-moodboard';
