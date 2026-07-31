-- Ajout d'une courte description de marque affichée dans le bloc d'introduction
-- du projet côté agence (ex: "Boutique de décoration et art de vivre...").
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table projects add column description text;
