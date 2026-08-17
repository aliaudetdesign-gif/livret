import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getDemoScope } from "@/lib/demoMode";
import { exitDemoMode } from "@/app/profil/actions";

import type { NavGroup } from "@/components/Sidebar";

const navGroups: NavGroup[] = [
  {
    label: "Menu",
    items: [
      { label: "Dashboard", href: "/agence/dashboard", icon: "dashboard" },
      { label: "Projets clients", href: "/agence/projets", icon: "projets" },
      { label: "Messagerie", href: "/agence/messagerie", icon: "messagerie" },
    ],
  },
  {
    label: "Général",
    items: [
      { label: "Corbeille", href: "/agence/corbeille", icon: "corbeille" },
      { label: "Réglages", href: "/agence/parametres", icon: "reglages" },
      { label: "Aide", href: "/agence/aide", icon: "aide" },
    ],
  },
];

export default async function AgenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_demo_account")
        .eq("id", user.id)
        .single()
    : { data: null };

  const demoScope = await getDemoScope();

  return (
    <div className="flex flex-col flex-1 px-[22px] pt-7 pb-10 gap-4">
      {demoScope && !profile?.is_demo_account && (
        <div className="glass rounded-card px-4 py-3 flex items-center justify-between gap-3 text-sm border border-clay-500/30">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🎭</span>
            <span className="font-medium">
              Mode démo actif — ce qui est modifié ici est visible par les recruteurs, tes projets réels ne sont pas concernés.
            </span>
          </div>
          <form action={exitDemoMode}>
            <button
              type="submit"
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-field bg-ink-900 text-white hover:bg-ink-900/85 transition-colors"
            >
              Quitter la démo
            </button>
          </form>
        </div>
      )}
      <div className="flex flex-1 gap-5 min-h-0">
        <Sidebar
          navGroups={navGroups}
          accountLabel={profile?.full_name || "AB.Design"}
          accountSubLabel="Mon profil"
          accountHref="/agence/profil"
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
