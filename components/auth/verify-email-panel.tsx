"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, LoaderCircle, XCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";
import { localePath, type Locale } from "@/lib/i18n/config";

export function VerifyEmailPanel({
  locale,
  token,
}: {
  locale: Locale;
  token: string;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authClient
      .verifyEmail({ query: { token } })
      .then(({ error }) => setState(error ? "error" : "success"))
      .catch(() => setState("error"));
  }, [token]);

  if (state === "loading") {
    return (
      <div className="auth-success">
        <LoaderCircle className="spin" size={28} />
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="auth-success">
        <BadgeCheck size={32} />
        <h2>{t("auth.verifySuccess")}</h2>
        <Link href={localePath(locale, "/auth/sign-in")} className="primary-btn">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-success">
      <XCircle size={32} />
      <h2>{t("auth.verifyFailed")}</h2>
      <Link href={localePath(locale, "/auth/sign-in")} className="ghost-btn">
        {t("common.back")}
      </Link>
    </div>
  );
}
