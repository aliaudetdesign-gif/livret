-- Permet l'envoi de messages (agence + client), le marquage lu/non lu,
-- et l'archivage d'un projet par l'agence (utilisé par la Messagerie).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- L'agence peut envoyer un message sur n'importe quel projet
create policy "messages: agence peut écrire"
  on messages for insert
  with check (is_agence());

-- Le client peut envoyer un message sur son propre projet
create policy "messages: client peut écrire sur son projet"
  on messages for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = messages.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

-- Marquer un message comme lu/non lu : l'agence peut modifier n'importe quel
-- message, le client seulement ceux de son propre projet.
create policy "messages: agence peut modifier"
  on messages for update
  using (is_agence())
  with check (is_agence());

create policy "messages: client peut modifier les siens"
  on messages for update
  using (
    exists (
      select 1 from projects
      where projects.id = messages.project_id
      and projects.client_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects
      where projects.id = messages.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

-- L'agence peut modifier un projet (ex : archiver/désarchiver depuis la Messagerie)
create policy "projects: agence peut modifier"
  on projects for update
  using (is_agence())
  with check (is_agence());
