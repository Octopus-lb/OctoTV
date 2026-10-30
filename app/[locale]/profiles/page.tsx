import { notFound, redirect } from "next/navigation";
import { ProfileManager } from "@/components/profiles/profile-manager";
import { getSession } from "@/lib/auth/server";
import { listProfiles } from "@/lib/profiles/server";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ProfilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const session = await getSession();
  if (!session) redirect(localePath(locale, "/auth/sign-in"));

  const profiles = await listProfiles(session.user.id);

  return (
    <main className="page profiles-page">
      <ProfileManager
        locale={locale}
        activeId={profiles[0]?.id ?? null}
        initial={profiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          isKids: profile.isKids,
        }))}
      />
    </main>
  );
}
