import Link from "next/link";
import { Brand } from "@/components/brand";
import { createTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function AuthShell({
  locale,
  title,
  subtitle,
  children,
  footer,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = createTranslator(locale);
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Brand locale={locale} />
        </div>
        <h1>{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
        <p className="auth-legal">
          <Link href={`/${locale}/legal/terms`}>{t("common.terms")}</Link>
          <span>·</span>
          <Link href={`/${locale}/legal/privacy`}>{t("common.privacy")}</Link>
        </p>
      </div>
    </main>
  );
}
