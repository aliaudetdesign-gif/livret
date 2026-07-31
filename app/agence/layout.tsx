import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

const navGroups = [
  {
    label: "Menu",
    items: [
      { label: "Dashboard", href: "/agence/dashboard" },
      { label: "Projets clients", href: "/agence/projets" },
      { label: "Messagerie", href: "/agence/messagerie" },
    ],
  },
  {
    label: "Général",
    items: [
      { label: "Corbeille", href: "/agence/corbeille" },
      { label: "Réglages", href: "/agence/parametres" },
      { label: "Aide", href: "/agence/aide" },
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
    <div className="flex flex-1">
      <Sidebar
        navGroups={navGroups}
        accountLabel={profile?.full_name || "AB.Design"}
        accountSubLabel="Mon profil"
        accountHref="/agence/profil"
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 bg-[var(--color-creme)] p-8">{children}</main>
    </div>
  );
}
