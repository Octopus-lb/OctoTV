"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function ClearHistoryButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    if (!window.confirm(t("activity.clearHistoryConfirm"))) return;
    setBusy(true);
    await fetch("/api/history", { method: "DELETE" }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className="ghost-btn small" disabled={busy} onClick={() => void clear()}>
      <Trash2 size={15} /> {t("activity.clearHistory")}
    </button>
  );
}
