import { notFound } from "next/navigation";
import { env } from "cloudflare:workers";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  return (
    <AuthShell locale={locale} title={t("auth.createAccount")} subtitle={t("auth.signUpSubtitle")}>
      <SignUpForm
        locale={locale}
        googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
      />
    </AuthShell>
  );
}
