-- Préférence de thème (clair / sombre / automatique), persistée par profil
-- pour suivre l'utilisateur d'un appareil à l'autre. Appliquée aussi côté
-- client via un cookie miroir (livret_theme, voir lib/themeMode.ts) pour un
-- rendu SSR sans flash, sur le même principe que le cookie livret_demo_mode
-- (migration 028 / lib/demoMode.ts).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table profiles
  add column if not exists theme_preference text not null default 'auto'
  check (theme_preference in ('light', 'dark', 'auto'));
