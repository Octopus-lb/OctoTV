"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import { localePath, type Locale } from "@/lib/i18n/config";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${localePath(locale, "/auth/reset-password")}`,
    });
    setBusy(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-success">
        <h2>{t("auth.checkEmail")}</h2>
        <p>{t("auth.verificationSent")}</p>
        <Link href={localePath(locale, "/auth/sign-in")} className="ghost-btn">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  return (
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
      <button type="submit" className="primary-btn" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />}
        {t("auth.sendResetLink")}
      </button>
    </form>
  );
}
