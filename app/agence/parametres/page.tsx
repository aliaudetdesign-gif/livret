import { createClient } from "@/lib/supabase/server";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { AgencyAccessSection } from "@/components/AgencyAccessSection";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function ParametresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("theme_preference").eq("id", user.id).single()
    : { data: null };

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
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Réglages</h1>
      <p className="text-sm text-ink-500 mb-8">Abonnement, gestion des accès et apparence.</p>

      <div className="flex flex-col gap-8 max-w-3xl">
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Abonnement
          </h2>
          <div className="glass rounded-card p-5">
            {subscription ? (
              <SubscriptionCard subscription={subscription} />
            ) : (
              <p className="text-sm text-ink-400">Aucun abonnement configuré.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Accès
          </h2>
          <div className="glass rounded-card p-5">
            <AgencyAccessSection invites={invites ?? []} />
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Thème
          </h2>
          <div className="glass rounded-card p-5">
            <ThemeToggle current={profile?.theme_preference ?? "auto"} />
          </div>
        </section>
      </div>
    </div>
  );
}
