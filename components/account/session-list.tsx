"use client";

import { useCallback, useEffect, useState } from "react";
import { Laptop, LoaderCircle, LogOut, Smartphone } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth/client";

type SessionRow = {
  id: string;
  token?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
};

export function SessionList() {
  const { t, formatDate } = useI18n();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await authClient.listSessions();
    setSessions((data as SessionRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch session list from the auth client
    void load();
  }, [load]);

  async function revoke(token: string | undefined) {
    if (!token) return;
    setBusy(true);
    await authClient.revokeSession({ token });
    await load();
    setBusy(false);
  }

  async function revokeAll() {
    setBusy(true);
    await authClient.revokeSessions();
    await load();
    setBusy(false);
  }

  if (!sessions) {
    return (
      <div className="status-box">
        <LoaderCircle className="spin" size={20} /> {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="session-list">
      {sessions.length === 0 && <p className="muted-text">{t("admin.noData")}</p>}
      {sessions.map((session) => {
        const agent = session.userAgent ?? "";
        const Icon = /mobile|android|iphone/i.test(agent) ? Smartphone : Laptop;
        return (
          <div key={session.id} className="session-row">
            <Icon size={20} />
            <div>
              <strong>{agent ? agent.slice(0, 64) : t("common.devices")}</strong>
              <small>
                {session.ipAddress ?? "—"} · {formatDate(session.createdAt)}
              </small>
            </div>
            <button
              type="button"
              className="ghost-btn small"
              disabled={busy}
              onClick={() => void revoke(session.token)}
            >
              {t("account.revoke")}
            </button>
          </div>
        );
      })}
      <button type="button" className="ghost-btn small" disabled={busy} onClick={() => void revokeAll()}>
        <LogOut size={15} /> {t("account.revokeAll")}
      </button>
    </div>
  );
}
