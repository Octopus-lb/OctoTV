import { redirect } from "next/navigation";
import { env } from "cloudflare:workers";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSession } from "@/lib/auth/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) redirect("/");
  const locale: Locale = raw;
  if (await getSession()) redirect(localePath(locale));
  const { t } = createTranslator(locale);

  return (
    <AuthShell locale={locale} title={t("auth.welcomeBack")} subtitle={t("auth.signInSubtitle")}>
      <SignInForm
        locale={locale}
        googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
      />
    </AuthShell>
  );
}
