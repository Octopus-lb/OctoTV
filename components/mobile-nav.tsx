"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, History, Home, Radio, Search } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { localePath, type Locale } from "@/lib/i18n/config";

export function MobileNav({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const pathname = usePathname() || "/";
  const active = (path: string) => {
    const parts = pathname.split("/").filter(Boolean);
    const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
    return path === "" ? rest === "" : rest.startsWith(path);
  };

  const items = [
    { href: localePath(locale), label: t("common.home"), icon: Home, path: "" },
    { href: localePath(locale, "/movies"), label: t("common.movies"), icon: Clapperboard, path: "/movies" },
    { href: localePath(locale, "/live"), label: t("common.live"), icon: Radio, path: "/live" },
    { href: localePath(locale, "/search"), label: t("common.search"), icon: Search, path: "/search" },
    { href: localePath(locale, "/history"), label: t("common.history"), icon: History, path: "/history" },
  ];

  return (
    <nav className="mobile-nav" aria-label={t("nav.mobile")}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active(item.path);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
