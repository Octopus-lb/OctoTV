"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

const JOBS = [
  { type: "tmdb", key: "admin.tmdbSync" },
  { type: "anilist", key: "admin.anilistSync" },
  { type: "iptv", key: "admin.iptvSync" },
  { type: "epg", key: "admin.epgSync" },
] as const;

type SyncResult = {
  jobType: string;
  status: string;
  itemsProcessed: number;
  errors: number;
  message: string;
};

export function AdminActions() {
  const { t } = useI18n();
  const router = useRouter();
  const [running, setRunning] = useState("");
  const [results, setResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState("");

  async function run(jobType: string) {
    setRunning(jobType);
    setError("");
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType }),
      });
      const data = (await response.json()) as SyncResult & { error?: string };
      if (response.status === 403) {
        setError(t("admin.unauthorized"));
      } else if (response.status === 401) {
        setError(t("auth.sessionExpired"));
      } else if (data.error) {
        setError(t("admin.failed"));
      } else {
        setResults((current) => [data, ...current].slice(0, 4));
        router.refresh();
      }
    } catch {
      setError(t("admin.failed"));
    } finally {
      setRunning("");
    }
  }

  return (
    <section className="admin-panel">
      <h2>{t("admin.runSync")}</h2>
      <div className="admin-actions">
        {JOBS.map((job) => (
          <button
            key={job.type}
            type="button"
            className="ghost-btn"
            disabled={Boolean(running)}
            onClick={() => void run(job.type)}
          >
            {running === job.type ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Play size={15} />
            )}
            {t(job.key)}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="sync-results">
        {results.map((result) => (
          <div key={`${result.jobType}-${result.message}`} className="sync-result">
            <strong>{t("admin.success")}: {result.jobType}</strong>
            <span>
              {result.itemsProcessed} {t("admin.items")} · {result.errors} {t("admin.errors")}
            </span>
            <small>{result.message}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlockChannelForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [id, setId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!id.trim() || !reason.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/channels/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iptvOrgId: id.trim(), reason: reason.trim() }),
      });
      if (!response.ok) throw new Error("failed");
      setMessage(t("admin.actionDone"));
      setId("");
      setReason("");
      router.refresh();
    } catch {
      setMessage(t("admin.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-panel">
      <h2>{t("live.channelUnavailable")}</h2>
      <form className="admin-form" onSubmit={submit}>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="iptv-org channel id"
          required
        />
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("admin.auditLog")}
          required
        />
        <button type="submit" className="primary-btn small" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={15} /> : null}
          {t("common.save")}
        </button>
      </form>
      {message && <p className="muted-text">{message}</p>}
    </section>
  );
}
