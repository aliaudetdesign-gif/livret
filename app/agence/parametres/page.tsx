import { createClient } from "@/lib/supabase/server";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { AgencyAccessSection } from "@/components/AgencyAccessSection";

export default async function ParametresPage() {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscription")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const { data: invites } = await supabase
    .from("agency_invites")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Réglages</h1>
      <p className="text-sm text-zinc-500 mb-8">Abonnement et gestion des accès.</p>

      <div className="flex flex-col gap-8 max-w-3xl">
        <section>
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-3">
            Abonnement
          </h2>
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            {subscription ? (
              <SubscriptionCard subscription={subscription} />
            ) : (
              <p className="text-sm text-zinc-400">Aucun abonnement configuré.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-3">
            Accès
          </h2>
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <AgencyAccessSection invites={invites ?? []} />
          </div>
        </section>
      </div>
    </div>
  );
}
