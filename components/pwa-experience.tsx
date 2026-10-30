"use client";

import Image from "next/image";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaExperience() {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext) return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
        console.error("OctoTV service worker registration failed", error);
      });
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || sessionStorage.getItem("octotv-install-dismissed")) return;

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "dismissed") {
      sessionStorage.setItem("octotv-install-dismissed", "1");
    }
  };

  const dismiss = () => {
    sessionStorage.setItem("octotv-install-dismissed", "1");
    setInstallEvent(null);
  };

  if (!installEvent) return null;

  return (
    <aside className="pwa-install" aria-label={t("pwa.installTitle")} aria-live="polite">
      <Image src="/octotv-icon-192.png" alt="" width={44} height={44} />
      <div className="pwa-install-copy">
        <strong>{t("pwa.installTitle")}</strong>
        <span>{t("pwa.installDescription")}</span>
      </div>
      <button type="button" className="pwa-install-action" onClick={() => void install()}>
        <Download size={16} aria-hidden="true" />
        {t("pwa.installAction")}
      </button>
      <button
        type="button"
        className="pwa-install-dismiss"
        aria-label={t("pwa.dismiss")}
        onClick={dismiss}
      >
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
