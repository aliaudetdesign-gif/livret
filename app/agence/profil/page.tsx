import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfessionalLinkForm } from "@/components/ProfessionalLinkForm";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { PasswordSecurityForm } from "@/components/PasswordSecurityForm";

export default async function AgenceProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <div>
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Mon profil</h1>
      <p className="text-sm text-ink-500 mb-8">Photo, nom et coordonnées.</p>

      <div className="flex flex-col gap-8 max-w-3xl">
        <section>
          <div className="glass rounded-card p-5">
            <ProfileForm
              fullName={profile?.full_name ?? ""}
              email={user?.email ?? ""}
              phone={profile?.phone ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Lien pro
          </h2>
          <div className="glass rounded-card p-5">
            <ProfessionalLinkForm professionalLink={profile?.professional_link ?? ""} />
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Notifications
          </h2>
          <div className="glass rounded-card p-5">
            <NotificationPreferencesForm
              notifyNewMessage={profile?.notify_new_message ?? true}
              notifyNewDocument={profile?.notify_new_document ?? true}
            />
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
            Sécurité
          </h2>
          <div className="glass rounded-card p-5">
            <PasswordSecurityForm />
          </div>
        </section>
      </div>
    </div>
  );
}
