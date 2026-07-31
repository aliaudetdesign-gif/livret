import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { label: "Dashboard", href: "/espace/dashboard" },
  { label: "Administratif", href: "/espace/administratif" },
  { label: "Design", href: "/espace/design" },
  { label: "Messagerie", href: "/espace/messagerie" },
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
    <div className="flex flex-1">
      <Sidebar
        sectionLabel="Ma marque"
        navItems={navItems}
        accountLabel={profile?.full_name || "Mon compte"}
        accountSubLabel="Mon profil"
        accountHref="/espace/profil"
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 bg-[var(--color-creme)] p-8">{children}</main>
    </div>
  );
}
