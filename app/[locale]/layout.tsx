import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { getDirection, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n";
import { getSession, isAdminUser } from "@/lib/auth/server";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const { t } = createTranslator(locale);
  return {
    title: {
      default: `OctoTV — ${t("common.movies")} & ${t("common.live")}`,
      template: "%s · OctoTV",
    },
    description: t("home.footerTagline"),
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      siteName: "OctoTV",
      title: "OctoTV",
      description: t("home.footerTagline"),
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const session = await getSession();
  const admin = await isAdminUser(session?.user ?? null);

  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        <I18nProvider locale={locale}>
          <SiteHeader
            locale={locale}
            user={
              session
                ? {
                    name: session.user.name,
                    email: session.user.email,
                    isAdmin: admin,
                  }
                : null
            }
          />
          <div id="main-content" className="app-shell">
            {children}
          </div>
          <SiteFooter locale={locale} />
          <MobileNav locale={locale} />
        </I18nProvider>
      </body>
    </html>
  );
}
