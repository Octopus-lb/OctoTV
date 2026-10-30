import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale: raw } = await params;
  const { token } = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  return (
    <AuthShell locale={locale} title={t("auth.verifyEmailTitle")}>
      <VerifyEmailPanel locale={locale} token={token ?? ""} />
    </AuthShell>
  );
}
