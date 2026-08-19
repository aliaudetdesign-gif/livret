import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import { ESSENTIEL_SECTIONS } from "@/lib/designEssentiel";

import type { NavGroup, NavItem } from "@/components/Sidebar";

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

  // Groupes Essentiel/Compléments affichés dans la sidebar une fois que le
  // client est entré dans une section de design précise (/espace/design/...),
  // pour naviguer d'une section à l'autre sans revenir à l'index. Récupérés
  // ici (layout, une fois par navigation) plutôt que dans chaque page pour
  // rester visibles sur toutes les sous-pages de /espace/design.
  const project = await getClientProject();
  let designExtraGroups: NavGroup[] | undefined;

  if (project) {
    const { data: projectSections } = await supabase
      .from("project_sections")
      .select("id, section_types(label, icon)")
      .eq("project_id", project.id)
      .is("deleted_at", null);

    const essentielItems: NavItem[] = ESSENTIEL_SECTIONS.map((s) => ({
      label: s.label,
      href: `/espace/design/${s.key}`,
      emoji: s.icon,
    }));

    const complementItems: NavItem[] = (
      (projectSections ?? []) as unknown as {
        id: string;
        section_types: { label: string; icon: string };
      }[]
    ).map((ps) => ({
      label: ps.section_types.label,
      href: `/espace/design/${ps.id}`,
      emoji: ps.section_types.icon,
    }));

    designExtraGroups = [
      { label: "Essentiel", items: essentielItems },
      { label: "Compléments", items: complementItems },
    ];
  }

  return (
    <div className="flex flex-1 gap-5 px-[22px] pt-7 pb-10">
      <Sidebar
        sectionLabel="Ma marque"
        navItems={navItems}
        extraGroups={designExtraGroups}
        extraGroupsPathPrefix="/espace/design/"
        accountLabel={profile?.full_name || "Mon compte"}
        accountSubLabel="Mon profil"
        accountHref="/espace/profil"
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
