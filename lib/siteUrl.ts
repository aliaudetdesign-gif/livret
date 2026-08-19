// URL de base de l'app, utilisée pour construire des liens absolus (lien
// d'invitation de compte) depuis une Server Action, hors du contexte d'une
// requête HTTP entrante. En prod, définir NEXT_PUBLIC_SITE_URL une fois le
// déploiement en place ; en local, retombe sur l'adresse de `npm run dev`.
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
