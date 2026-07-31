import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les logos PDF + leur aperçu généré côté navigateur peuvent dépasser
      // la limite par défaut de 1 Mo pour le body d'une server action.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
