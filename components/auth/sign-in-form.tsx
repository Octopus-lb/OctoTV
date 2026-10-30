"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import { localePath, type Locale } from "@/lib/i18n/config";

export function SignInForm({
  locale,
  googleEnabled,
}: {
  locale: Locale;
  googleEnabled: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
      setMessage(
        text.includes("verif")
          ? t("auth.verifyEmailRequired")
          : text.includes("invalid")
            ? t("auth.invalidCredentials")
            : t("auth.genericAuthError"),
      );
      setBusy(false);
      return;
    }
    router.push(localePath(locale));
    router.refresh();
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

  return (
    <>
      <form className="auth-form" onSubmit={submit}>
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
          />
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <LogIn size={17} />}
          {t("common.signIn")}
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
        <Link href={localePath(locale, "/auth/forgot-password")}>{t("auth.forgotPassword")}</Link>
        <span>
          {t("auth.noAccount")}{" "}
          <Link href={localePath(locale, "/auth/sign-up")}>{t("common.signUp")}</Link>
        </span>
      </div>
    </>
  );
}
