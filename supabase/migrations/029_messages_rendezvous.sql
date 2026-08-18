-- Ajoute le support des propositions de rendez-vous dans la messagerie
-- (agence <-> client), sur le modèle de la négociation d'offre Vinted :
-- un message peut désormais être un simple texte ou une proposition de
-- rendez-vous structurée (date, heure, lieu, statut).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table messages
  add column if not exists type text not null default 'text'
    check (type in ('text', 'rendezvous'));

alter table messages
  add column if not exists metadata jsonb;

-- Aucune policy RLS supplémentaire nécessaire : les policies d'update
-- existantes sur messages (migration 004 + 028) sont scopées par projet,
-- pas par expéditeur. Un client peut donc bien accepter/refuser un message
-- envoyé par l'agence (et inversement) en modifiant son metadata.status.
