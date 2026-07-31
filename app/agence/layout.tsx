import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

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
    ? await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="flex flex-1 gap-5 px-[22px] pt-7 pb-10">
      <Sidebar
        navGroups={navGroups}
        accountLabel={profile?.full_name || "AB.Design"}
        accountSubLabel="Mon profil"
        accountHref="/agence/profil"
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
