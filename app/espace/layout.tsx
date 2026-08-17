import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

import type { NavItem } from "@/components/Sidebar";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/espace/dashboard", icon: "dashboard" },
  { label: "Administratif", href: "/espace/administratif", icon: "administratif" },
  { label: "Design", href: "/espace/design", icon: "design" },
  { label: "Messagerie", href: "/espace/messagerie", icon: "messagerie" },
  { label: "Aide", href: "/espace/aide", icon: "aide" },
];

export default async function EspaceLayout({
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
        sectionLabel="Ma marque"
        navItems={navItems}
        accountLabel={profile?.full_name || "Mon compte"}
        accountSubLabel="Mon profil"
        accountHref="/espace/profil"
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
