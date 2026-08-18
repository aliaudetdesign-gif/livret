import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getThemeCookie } from "@/lib/themeMode";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "livret.",
  description: "Livrets de marque pour agences et clients",
};

// Script exécuté avant le premier rendu peint, uniquement quand la
// préférence est "auto" : "light"/"dark" sont déjà résolus côté serveur
// ci-dessous via le cookie miroir (voir lib/themeMode.ts), donc inutile de
// le réévaluer côté client dans ces deux cas. Ici on interroge directement
// prefers-color-scheme (pas besoin de relire le cookie, qui est httpOnly).
const AUTO_THEME_SCRIPT = `(function(){try{if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePreference = await getThemeCookie();
  const isDarkServer = themePreference === "dark";

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDarkServer ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
        {themePreference === "auto" && (
          <script dangerouslySetInnerHTML={{ __html: AUTO_THEME_SCRIPT }} />
        )}
        {/* Nappes de couleur floutées : c'est ce que le verre réfracte.
            Sans elles, l'effet retombe à plat. */}
        <div className="mesh" aria-hidden>
          <span className="b1" />
          <span className="b2" />
          <span className="b3" />
          <span className="b4" />
        </div>
        <div className="grain" aria-hidden />

        <div className="relative z-[2] flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
