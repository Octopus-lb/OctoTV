import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  History,
  List,
  MonitorSmartphone,
  Radio,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { AccountSettings } from "@/components/account/account-settings";
import { getSession, isAdminUser } from "@/lib/auth/server";
import { getViewer, listProfiles } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const session = await getSession();
  if (!session) redirect(localePath(locale, "/auth/sign-in"));
  const { t, formatDate } = createTranslator(locale);
  const [viewer, profiles, admin] = await Promise.all([
    getViewer(),
    listProfiles(session.user.id),
    isAdminUser(session.user),
  ]);

  const links = [
    { href: "/profiles", label: t("profiles.manage"), icon: UserRound },
    { href: "/history", label: t("common.history"), icon: History },
    { href: "/watchlist", label: t("common.watchlist"), icon: Clock },
    { href: "/lists", label: t("common.myLists"), icon: List },
    { href: "/account/devices", label: t("common.devices"), icon: MonitorSmartphone },
  ];

  return (
    <main className="page account-page">
      <header className="page-intro">
        <span className="kicker">{t("common.account")}</span>
        <h1>{session.user.name}</h1>
        <p>{session.user.email}</p>
        <p className="chip-row">
          <span className={`chip ${session.user.emailVerified ? "ok" : "warn"}`}>
            {session.user.emailVerified ? <BadgeCheck size={14} /> : <ShieldAlert size={14} />}
            {session.user.emailVerified ? t("account.verified") : t("account.unverified")}
          </span>
          {viewer && (
            <span className="chip">
              {t("common.profile")}: {viewer.profile.name}
            </span>
          )}
          {session.session.createdAt && (
            <span className="chip">
              {formatDate(session.session.createdAt)}
            </span>
          )}
        </p>
      </header>

      <div className="account-grid">
        <nav className="account-nav" aria-label={t("common.account")}>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={localePath(locale, item.href)}>
                <Icon size={17} /> {item.label}
              </Link>
            );
          })}
          {admin && (
            <Link href={localePath(locale, "/admin")}>
              <Radio size={17} /> {t("common.admin")}
            </Link>
          )}
        </nav>
        <div>
          <p className="muted-text">
            {profiles.length} / 5 {t("common.profiles")}
          </p>
          <AccountSettings locale={locale} />
          <p className="rights-note">{t("account.deleteAccountBody")}</p>
        </div>
      </div>
    </main>
  );
}
