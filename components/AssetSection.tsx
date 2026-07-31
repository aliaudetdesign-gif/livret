import { createClient } from "@/lib/supabase/server";
import { getClientProject } from "@/lib/getClientProject";
import type { AssetType } from "@/lib/types";

export async function AssetSection({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: AssetType;
}) {
  const project = await getClientProject();

  if (!project) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun projet rattaché à ton compte pour l&apos;instant.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("brand_assets")
    .select("*")
    .eq("project_id", project.id)
    .eq("type", type)
    .is("deleted_at", null);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      <p className="text-sm text-zinc-500 mb-6">{description}</p>

      {(assets ?? []).length === 0 ? (
        <p className="text-sm text-zinc-400">
          Rien à afficher pour l&apos;instant, ton agence n&apos;a pas encore
          ajouté d&apos;éléments ici.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {(assets ?? []).map((asset) => (
            <div
              key={asset.id}
              className="bg-white border border-zinc-100 rounded-lg p-4"
            >
              {type === "logo" || type === "moodboard" ? (
                <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.value}
                    alt={asset.label}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <div className="font-medium text-sm">{asset.label}</div>
              {type !== "logo" && type !== "moodboard" && (
                <div className="text-xs text-zinc-500">{asset.value}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
