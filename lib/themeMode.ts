import { cookies } from "next/headers";
import type { ThemePreference } from "@/lib/types";

// Nom du cookie miroir de profiles.theme_preference, lu côté serveur dans
// app/layout.tsx pour poser la classe .dark sur <html> avant le premier
// rendu (pas de flash clair→sombre). Même principe que livret_demo_mode
// (lib/demoMode.ts) : httpOnly, jamais lu côté client, le cas "auto" est
// géré par un script inline distinct (voir app/layout.tsx) qui interroge
// directement prefers-color-scheme plutôt que ce cookie.
export const THEME_COOKIE = "livret_theme";

// Lit la préférence de thème depuis le cookie. Défaut "auto" si absent
// (première visite, avant tout choix explicite en page profil).
export async function getThemeCookie(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  if (value === "light" || value === "dark" || value === "auto") {
    return value;
  }
  return "auto";
}
