import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AdminDashboard, type AdminSection } from "@/components/admin/admin-dashboard";
import { requireAdmin } from "@/lib/auth/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const SECTIONS: AdminSection[] = ["catalog", "playback", "live", "system"];

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale: raw, section } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  if (!SECTIONS.includes(section as AdminSection)) notFound();
  const { session, authorized } = await requireAdmin();
  if (!session) redirect(localePath(locale, "/auth/sign-in"));
  const { t } = createTranslator(locale);

  if (!authorized) {
    return (
      <main className="page empty-page">
        <div className="empty-state">
          <ShieldAlert size={30} />
          <strong>{t("admin.unauthorized")}</strong>
          <Link href={localePath(locale)} className="ghost-btn">
            {t("common.goHome")}
          </Link>
        </div>
      </main>
    );
  }

  return <AdminDashboard locale={locale} section={section as AdminSection} />;
}
