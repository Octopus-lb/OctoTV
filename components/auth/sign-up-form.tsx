"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import { localePath, type Locale } from "@/lib/i18n/config";

export function SignUpForm({
  locale,
  googleEnabled,
}: {
  locale: Locale;
  googleEnabled: boolean;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!agree) return;
    setBusy(true);
    setMessage("");
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      preferredLocale: locale,
      callbackURL: `${window.location.origin}${localePath(locale, "/auth/verify-email")}`,
    });
    setBusy(false);
    if (error) {
      const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
      setMessage(
        text.includes("exist")
          ? t("auth.emailTaken")
          : text.includes("password")
            ? t("auth.passwordHint")
            : t("auth.genericAuthError"),
      );
      return;
    }
    setDone(true);
  }

  async function google() {
    setBusy(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${localePath(locale)}`,
    });
    if (error) {
      setMessage(t("auth.genericAuthError"));
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="auth-success">
        <h2>{t("auth.checkEmail")}</h2>
        <p>{t("auth.verifyEmailBody", { email })}</p>
        <Link href={localePath(locale, "/auth/sign-in")} className="primary-btn">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>{t("common.name")}</span>
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("auth.namePlaceholder")}
          />
        </label>
        <label>
          <span>{t("common.email")}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.emailPlaceholder")}
          />
        </label>
        <label>
          <span>{t("common.password")}</span>
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
          />
          <small>{t("auth.passwordHint")}</small>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            required
          />
          <span>{t("auth.agreeTerms")}</span>
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button type="submit" className="primary-btn" disabled={busy || !agree}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <UserPlus size={17} />}
          {t("common.signUp")}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="auth-divider"><span>{t("auth.orContinueWith")}</span></div>
          <button type="button" className="ghost-btn social-btn" onClick={() => void google()} disabled={busy}>
            {t("auth.continueWithGoogle")}
          </button>
        </>
      )}

      <div className="auth-links">
        <span>
          {t("auth.haveAccount")}{" "}
          <Link href={localePath(locale, "/auth/sign-in")}>{t("common.signIn")}</Link>
        </span>
      </div>
    </>
  );
}
