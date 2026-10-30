import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  return (
    <AuthShell
      locale={locale}
      title={t("auth.resetPassword")}
      subtitle={t("auth.resetPasswordSubtitle")}
    >
      <ForgotPasswordForm locale={locale} />
    </AuthShell>
  );
}
