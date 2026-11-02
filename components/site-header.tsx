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
  Check,
  Monitor,
  Moon,
  Settings2,
  Sun,
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

type ThemeChoice = "dark" | "light" | "system";
const THEME_COOKIE = "octotv_theme";
const CONSENT_COOKIE = "octotv_preferences_consent";

function saveCookie(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax${secure}`;
}

function applyTheme(theme: ThemeChoice) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  root.dataset.themePreference = theme;
  root.style.colorScheme = root.dataset.theme;
}

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
  initialTheme,
  hasCookieConsent,
}: {
  locale: Locale;
  user: HeaderUser;
  initialTheme: ThemeChoice;
  hasCookieConsent: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>(initialTheme);
  const [showCookieNote, setShowCookieNote] = useState(!hasCookieConsent);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const languagePopoverRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [theme]);

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

  function changeTheme(next: ThemeChoice) {
    setTheme(next);
    saveCookie(THEME_COOKIE, next);
    applyTheme(next);
  }

  useEffect(() => {
    if (!settingsOpen && !langOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (settingsButtonRef.current?.contains(target) || settingsPopoverRef.current?.contains(target)) return;
      if (languageButtonRef.current?.contains(target) || languagePopoverRef.current?.contains(target)) return;
      setSettingsOpen(false);
      setLangOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen, langOpen]);

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
          ref={settingsButtonRef}
          type="button"
          className="icon-btn settings-trigger"
          aria-label={t("common.settings")}
          aria-expanded={settingsOpen}
          aria-controls="site-settings-popover"
          onClick={() => { setSettingsOpen((open) => !open); setLangOpen(false); }}
        >
          <Settings2 size={18} />
        </button>

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

      {settingsOpen && (
        <section ref={settingsPopoverRef} id="site-settings-popover" className="site-settings-popover" aria-label={t("common.settings")}>
          <div className="site-settings-heading">
            <span className="settings-icon-wrap"><Settings2 size={17} /></span>
            <div><h2>{t("common.settings")}</h2><p>{t("preferences.subtitle")}</p></div>
            <button type="button" className="settings-close" aria-label={t("common.close")} onClick={() => setSettingsOpen(false)}><X size={17} /></button>
          </div>
          <div className="preference-section">
            <h3>{t("preferences.theme")}</h3>
            <div className="preference-options theme-options" role="group" aria-label={t("preferences.theme")}>
              {([
                ["dark", t("preferences.dark"), Moon],
                ["light", t("preferences.light"), Sun],
                ["system", t("preferences.system"), Monitor],
              ] as const).map(([value, label, Icon]) => (
                <button key={value} type="button" className={theme === value ? "selected" : ""} aria-pressed={theme === value} onClick={() => changeTheme(value)}>
                  <Icon size={16} /><span>{label}</span>{theme === value && <Check className="selected-check" size={15} />}
                </button>
              ))}
            </div>
          </div>
          <div className="preference-section">
            <h3>{t("common.language")}</h3>
            <div className="preference-options language-options" role="group" aria-label={t("common.language")}>
              {locales.map((item) => (
                <button key={item} type="button" className={item === locale ? "selected" : ""} aria-pressed={item === locale} onClick={() => changeLocale(item)}>
                  <span>{localeNames[item]}</span><b>{localeShortNames[item]}</b>{item === locale && <Check className="selected-check" size={15} />}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {showCookieNote && (
        <aside className="preference-cookie-note" role="status">
          <div><strong>{t("preferences.cookieTitle")}</strong><p>{t("preferences.cookieNote")}</p></div>
          <button type="button" onClick={() => { saveCookie(CONSENT_COOKIE, "accepted"); setShowCookieNote(false); }}>{t("preferences.acceptCookies")}</button>
        </aside>
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
