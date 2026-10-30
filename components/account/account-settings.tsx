"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe2, KeyRound, LoaderCircle, LogOut } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import {
  localeNames,
  locales,
  localePath,
  replaceLocaleInPath,
  type Locale,
} from "@/lib/i18n/config";
import { persistLocaleCookie } from "@/lib/i18n/cookie";

export function AccountSettings({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function changeLocale(next: Locale) {
    setSelectedLocale(next);
    await fetch("/api/account/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => undefined);
    persistLocaleCookie(next);
    const target = replaceLocaleInPath(window.location.pathname, next);
    router.push(target);
    router.refresh();
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy("password");
    setMessage("");
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setBusy("");
    if (error) {
      setMessage(t("auth.genericAuthError"));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage(t("auth.passwordUpdated"));
  }

  async function signOut() {
    setBusy("signout");
    await authClient.signOut();
    router.push(localePath(selectedLocale, "/auth/sign-in"));
    router.refresh();
  }

  return (
    <div className="settings-panel-inline">
      <section className="settings-block">
        <h2>
          <Globe2 size={18} /> {t("account.locale")}
        </h2>
        <div className="locale-options">
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              className={selectedLocale === item ? "active" : undefined}
              onClick={() => void changeLocale(item)}
            >
              {localeNames[item]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h2>
          <KeyRound size={18} /> {t("account.security")}
        </h2>
        <form className="auth-form compact" onSubmit={changePassword}>
          <label>
            <span>{t("common.password")}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            <span>{t("auth.newPassword")}</span>
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          {message && <p className="muted-text">{message}</p>}
          <button type="submit" className="primary-btn small" disabled={busy === "password"}>
            {busy === "password" ? <LoaderCircle className="spin" size={15} /> : null}
            {t("auth.updatePassword")}
          </button>
        </form>
      </section>

      <section className="settings-block">
        <h2>
          <LogOut size={18} /> {t("common.signOut")}
        </h2>
        <button type="button" className="ghost-btn" onClick={() => void signOut()} disabled={busy === "signout"}>
          <LogOut size={16} /> {t("common.signOut")}
        </button>
      </section>
    </div>
  );
}
