import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { PasswordSecurityForm } from "@/components/PasswordSecurityForm";

export default async function EspaceProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Mon profil</h1>
      <p className="text-sm text-zinc-500 mb-8">Photo, nom et coordonnées.</p>

      <div className="flex flex-col gap-8 max-w-3xl">
        <section>
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <ProfileForm
              fullName={profile?.full_name ?? ""}
              email={user?.email ?? ""}
              phone={profile?.phone ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-3">
            Notifications
          </h2>
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <NotificationPreferencesForm
              notifyNewMessage={profile?.notify_new_message ?? true}
              notifyNewDocument={profile?.notify_new_document ?? true}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-3">
            Sécurité
          </h2>
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <PasswordSecurityForm />
          </div>
        </section>
      </div>
    </div>
  );
}
