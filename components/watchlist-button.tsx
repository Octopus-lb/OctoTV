"use client";

import { useState } from "react";
import { Check, ListPlus, LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function WatchlistButton({
  titleId,
  titleName,
  initial = false,
}: {
  titleId: string;
  titleName: string;
  initial?: boolean;
}) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/watchlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId, titleName }),
      });
      if (response.status === 401) {
        setMessage(t("auth.sessionExpired"));
        return;
      }
      if (!response.ok) {
        setMessage(t("common.loadFailed"));
        return;
      }
      setSaved(!saved);
    } catch {
      setMessage(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-action">
      <button
        type="button"
        className={saved ? "primary-btn" : "ghost-btn"}
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={saved}
      >
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : saved ? (
          <Check size={17} />
        ) : (
          <ListPlus size={18} />
        )}
        {saved ? t("common.removeFromList") : t("common.addToList")}
      </button>
      {message && <small className="error-text">{message}</small>}
    </div>
  );
}
