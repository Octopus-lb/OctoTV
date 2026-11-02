import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { DisableContextMenu } from "@/components/disable-context-menu";
import { PwaExperience } from "@/components/pwa-experience";
import { getDirection, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n";
import { getSession, isAdminUser } from "@/lib/auth/server";
import { cookies } from "next/headers";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
  colorScheme: "dark",
};

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
    icons: {
      icon: [
        { url: "/octotv-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/octotv-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/octotv-icon-192.png",
      apple: "/octotv-icon-192.png",
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "OctoTV",
    },
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
  const cookieStore = await cookies();
  const themePreference = cookieStore.get("octotv_theme")?.value;
  const initialTheme = themePreference === "light" || themePreference === "system" ? themePreference : "dark";
  const hasCookieConsent = cookieStore.get("octotv_preferences_consent")?.value === "accepted";

  return (
    <html lang={locale} dir={getDirection(locale)} data-theme={initialTheme} data-theme-preference={themePreference ?? "dark"} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        <I18nProvider locale={locale}>
          <DisableContextMenu />
          <PwaExperience />
          <SiteHeader
            locale={locale}
            initialTheme={initialTheme}
            hasCookieConsent={hasCookieConsent}
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
