import { notFound, redirect } from "next/navigation";
import { ListsManager } from "@/components/activity/lists-manager";
import { getCustomLists } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ListsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, "/auth/sign-in"));
  const { t } = createTranslator(locale);
  const lists = await getCustomLists(viewer.profile.id);

  return (
    <main className="page">
      <header className="page-intro">
        <span className="kicker">{t("common.profile")}</span>
        <h1>{t("activity.listsTitle")}</h1>
      </header>
      <ListsManager
        locale={locale}
        initial={lists.map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description,
        }))}
      />
    </main>
  );
}
