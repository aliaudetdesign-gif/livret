import { createClient } from "@/lib/supabase/server";
import { TrashList, type TrashEntry } from "@/components/TrashList";
import { purgeExpiredTrash } from "./actions";
import { TRASH_RETENTION_DAYS } from "@/lib/trash";
import { getDemoScope } from "@/lib/demoMode";

export default async function CorbeillePage() {
  // Nettoyage paresseux : purge tout élément au-delà du délai de rétention
  // avant de lire la corbeille, faute de tâche planifiée côté serveur.
  await purgeExpiredTrash();

  const supabase = await createClient();
  const scope = await getDemoScope();

  const [
    { data: brandAssets },
    { data: documents },
    { data: sections },
    { data: sectionAssets },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("brand_assets")
      .select("*, projects!inner(id, name)")
      .not("deleted_at", "is", null)
      .eq("projects.is_demo", scope),
    supabase
      .from("project_documents")
      .select("*, projects!inner(id, name)")
      .not("deleted_at", "is", null)
      .eq("projects.is_demo", scope),
    supabase
      .from("project_sections")
      .select("*, section_types(label), projects!inner(id, name)")
      .not("deleted_at", "is", null)
      .eq("projects.is_demo", scope),
    supabase
      .from("section_assets")
      .select("*, project_sections!inner(deleted_at, projects!inner(id, name))")
      .not("deleted_at", "is", null)
      .eq("project_sections.projects.is_demo", scope),
    supabase
      .from("projects")
      .select("id, name, deleted_at")
      .not("deleted_at", "is", null)
      .eq("is_demo", scope),
  ]);

  const entries: TrashEntry[] = [
    ...(brandAssets ?? []).map((a) => ({
      type: "brand_asset" as const,
      id: a.id as string,
      label: a.label as string,
      typeLabel: "Élément de marque",
      deletedAt: a.deleted_at as string,
      projectId: a.projects?.id ?? null,
      projectName: a.projects?.name ?? "Projet supprimé",
    })),
    ...(documents ?? []).map((d) => ({
      type: "project_document" as const,
      id: d.id as string,
      label: d.label as string,
      typeLabel: "Document",
      deletedAt: d.deleted_at as string,
      projectId: d.projects?.id ?? null,
      projectName: d.projects?.name ?? "Projet supprimé",
    })),
    ...(sections ?? []).map((s) => ({
      type: "project_section" as const,
      id: s.id as string,
      label: s.section_types?.label ?? "Section",
      typeLabel: "Section complémentaire",
      deletedAt: s.deleted_at as string,
      projectId: s.projects?.id ?? null,
      projectName: s.projects?.name ?? "Projet supprimé",
    })),
    // Les fichiers dont la section parente est elle-même dans la corbeille ne
    // sont pas listés à part : les restaurer viendrait avec la restauration
    // de la section.
    ...(sectionAssets ?? [])
      .filter((a) => !a.project_sections?.deleted_at)
      .map((a) => ({
        type: "section_asset" as const,
        id: a.id as string,
        label: a.label as string,
        typeLabel: "Fichier de section",
        deletedAt: a.deleted_at as string,
        projectId: a.project_sections?.projects?.id ?? null,
        projectName: a.project_sections?.projects?.name ?? "Projet supprimé",
      })),
    // Un projet supprimé forme son propre groupe dans la corbeille : son nom
    // sert à la fois de projectName (regroupement) et de label (affichage).
    ...(projects ?? []).map((p) => ({
      type: "project" as const,
      id: p.id as string,
      label: p.name as string,
      typeLabel: "Projet",
      deletedAt: p.deleted_at as string,
      projectId: p.id as string,
      projectName: p.name as string,
    })),
  ].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));

  return (
    <div>
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Corbeille</h1>
      <p className="text-sm text-ink-500 mb-8">
        Les éléments supprimés restent ici {TRASH_RETENTION_DAYS} jours, récupérables jusqu&apos;à
        leur suppression définitive automatique.
      </p>
      <TrashList entries={entries} />
    </div>
  );
}
