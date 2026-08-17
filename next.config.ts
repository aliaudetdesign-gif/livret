import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js n'offre pas de valeur "illimitée" pour bodySizeLimit, seulement
      // une taille précise. Réglé volontairement très haut (pas de limite
      // pratique pour le moment) : à resserrer plus tard si besoin.
      bodySizeLimit: "1gb",
    },
    // Limite séparée de bodySizeLimit ci-dessus : s'applique à la couche proxy
    // interne de Next.js, activée dès qu'un middleware.ts est présent (c'est
    // notre cas, pour le rafraîchissement de session Supabase). Par défaut
    // 10 Mo, ce qui tronquait silencieusement les documents PDF un peu plus
    // lourds (ex: 11 Mo) avant même d'atteindre la Server Action, provoquant
    // l'erreur "Unexpected end of form".
    proxyClientMaxBodySize: "1gb",
  },
};

export default nextConfig;
