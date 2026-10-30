"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CircleUserRound,
  Globe2,
  LogIn,
  Menu,
  Radio,
  Shield,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { useI18n } from "@/components/i18n-provider";
import {
  localeNames,
  localeShortNames,
  locales,
  localePath,
  replaceLocaleInPath,
  type Locale,
} from "@/lib/i18n/config";
import { persistLocaleCookie } from "@/lib/i18n/cookie";

export type HeaderUser = {
  name: string;
  email: string;
  isAdmin: boolean;
} | null;

const NAV = [
  { key: "common.home", path: "" },
  { key: "common.movies", path: "/movies" },
  { key: "common.shows", path: "/shows" },
  { key: "common.anime", path: "/anime" },
  { key: "common.live", path: "/live" },
] as const;

export function SiteHeader({
  locale,
  user,
}: {
  locale: Locale;
  user: HeaderUser;
}) {
  const { t } = useI18n();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const languagePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (languageButtonRef.current?.contains(target) || languagePopoverRef.current?.contains(target)) return;
      setLangOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLangOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [langOpen]);

  const activePath = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  }, [pathname]);

  function changeLocale(next: Locale) {
    persistLocaleCookie(next);
    const target = replaceLocaleInPath(pathname, next);
    setLangOpen(false);
    setMenuOpen(false);
    if (user) {
      void fetch("/api/account/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).catch(() => undefined);
    }
    router.push(target);
    router.refresh();
  }

  return (
    <header className="topbar">
      <Brand locale={locale} />

      <nav className="desktop-nav" aria-label={t("nav.main")}>
        {NAV.map((item) => {
          const href = localePath(locale, item.path || "/");
          const isActive =
            item.path === "" ? activePath === "" : activePath.startsWith(item.path);
          return (
            <Link
              key={item.key}
              href={href}
              className={isActive ? "active" : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {t(item.key)}
              {item.path === "/live" && <span className="live-dot" />}
            </Link>
          );
        })}
      </nav>

      <div className="top-actions">
        <button aria-label={t("common.live")} className="icon-btn" onClick={() => router.push(localePath(locale, "/live"))}>
          <Radio size={19} />
        </button>
        <button
          ref={languageButtonRef}
          type="button"
          className="icon-btn lang-button"
          aria-label={`${localeShortNames[locale]} ${t("common.language")}`}
          aria-expanded={langOpen}
          onClick={() => setLangOpen((open) => !open)}
        >
          <Globe2 size={18} />
        </button>

        {user ? (
          <div className="profile-menu">
            <Link
              href={localePath(locale, "/account")}
              className="profile"
              aria-label={t("common.account")}
              title={user.email}
            >
              <CircleUserRound size={22} />
            </Link>
            {user.isAdmin && (
              <Link href={localePath(locale, "/admin")} className="icon-btn" aria-label={t("common.admin")}>
                <Shield size={18} />
              </Link>
            )}
          </div>
        ) : (
          <Link
            href={localePath(locale, "/auth/sign-in")}
            className="signin-btn signin-icon"
            aria-label={t("common.signIn")}
            title={t("common.signIn")}
          >
            <LogIn size={18} aria-hidden="true" />
          </Link>
        )}

        <button
          type="button"
          className="icon-btn mobile-menu-button"
          aria-label={t("nav.mobile")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {langOpen && (
        <div ref={languagePopoverRef} className="lang-popover" role="menu" aria-label={t("common.language")}>
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              role="menuitemradio"
              aria-checked={item === locale}
              className={item === locale ? "active" : undefined}
              onClick={() => changeLocale(item)}
            >
              <span>{localeNames[item]}</span>
              <b>{localeShortNames[item]}</b>
            </button>
          ))}
        </div>
      )}

      {menuOpen && (
        <div className="mobile-sheet">
          <nav aria-label={t("nav.mobile")}>
            {NAV.map((item) => (
              <Link key={item.key} href={localePath(locale, item.path || "/")} onClick={() => setMenuOpen(false)}>
                {item.key === "common.live" && <Radio size={16} />}
                {t(item.key)}
              </Link>
            ))}
            <Link href={localePath(locale, "/watchlist")} onClick={() => setMenuOpen(false)}>
              <Bell size={16} />
              {t("common.watchlist")}
            </Link>
            <Link href={localePath(locale, "/history")} onClick={() => setMenuOpen(false)}>
              {t("common.history")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
