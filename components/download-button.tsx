"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type DownloadOption = {
  assetId: string;
  url: string;
  quality: string | null;
  format: string;
  server: string;
};

export function DownloadButton({ contentId }: { contentId: string }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<DownloadOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (options) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/download/options?contentId=${encodeURIComponent(contentId)}`);
      if (response.status === 401) {
        setMessage(t("auth.sessionExpired"));
        return;
      }
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { downloads: DownloadOption[] };
      setOptions(data.downloads);
      if (!data.downloads.length) setMessage(t("player.downloadError"));
    } catch {
      setMessage(t("player.downloadError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="download-block">
      <button type="button" className="ghost-btn" onClick={() => void load()} disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}
        {t("common.download")}
      </button>
      {options?.map((option) => (
        <a key={option.assetId} href={option.url} className="download-link" download>
          {option.quality ?? option.format} · {option.server}
        </a>
      ))}
      {message && <small className="muted-text">{message}</small>}
    </div>
  );
}
