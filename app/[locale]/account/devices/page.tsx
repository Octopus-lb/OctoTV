import { notFound, redirect } from "next/navigation";
import { SessionList } from "@/components/account/session-list";
import { getSession } from "@/lib/auth/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function DevicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  if (!(await getSession())) redirect(localePath(locale, "/auth/sign-in"));
  const { t } = createTranslator(locale);

  return (
    <main className="page account-page">
      <header className="page-intro">
        <span className="kicker">{t("common.account")}</span>
        <h1>{t("account.sessions")}</h1>
        <p>{t("account.security")}</p>
      </header>
      <SessionList />
    </main>
  );
}
