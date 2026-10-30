"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import { localePath, type Locale } from "@/lib/i18n/config";

export function ResetPasswordForm({
  locale,
  token,
}: {
  locale: Locale;
  token: string;
}) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError(t("auth.verifyFailed"));
      return;
    }
    setBusy(true);
    setError("");
    const { error: requestError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (requestError) {
      setError(t("auth.verifyFailed"));
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="auth-success">
        <h2>{t("auth.verifyFailed")}</h2>
        <Link href={localePath(locale, "/auth/forgot-password")} className="primary-btn">
          {t("auth.forgotPassword")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-success">
        <h2>{t("auth.passwordUpdated")}</h2>
        <Link href={localePath(locale, "/auth/sign-in")} className="primary-btn">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        <span>{t("auth.newPassword")}</span>
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
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="primary-btn" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}
        {t("auth.updatePassword")}
      </button>
    </form>
  );
}
