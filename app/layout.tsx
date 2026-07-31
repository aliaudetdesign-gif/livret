import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
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
