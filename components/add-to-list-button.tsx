"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ListPlus, LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { localePath, type Locale } from "@/lib/i18n/config";

type ListSummary = { id: string; name: string };

export function AddToListButton({
  locale,
  titleId,
  titleName,
}: {
  locale: Locale;
  titleId: string;
  titleName: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [busy, setBusy] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function openMenu() {
    setOpen((value) => !value);
    if (lists) return;
    try {
      const response = await fetch("/api/lists");
      if (!response.ok) {
        setError(t("auth.sessionExpired"));
        return;
      }
      const data = (await response.json()) as { lists: ListSummary[] };
      setLists(data.lists);
    } catch {
      setError(t("common.error"));
    }
  }

  async function add(list: ListSummary) {
    setBusy(list.id);
    setError("");
    try {
      const response = await fetch(`/api/lists/${list.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId, titleName }),
      });
      if (!response.ok) throw new Error("failed");
      setAdded((current) => [...current, list.id]);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="list-picker">
      <button type="button" className="ghost-btn" onClick={() => void openMenu()} aria-expanded={open}>
        <ListPlus size={18} /> {t("common.myLists")}
      </button>
      {open && (
        <div className="list-popover">
          {!lists && <p>{t("common.loading")}</p>}
          {lists?.length === 0 && (
            <Link href={localePath(locale, "/lists")} className="view-all">
              {t("activity.createList")}
            </Link>
          )}
          {lists?.map((list) => (
            <button
              key={list.id}
              type="button"
              disabled={busy === list.id || added.includes(list.id)}
              onClick={() => void add(list)}
            >
              <span>{list.name}</span>
              {busy === list.id ? (
                <LoaderCircle className="spin" size={14} />
              ) : added.includes(list.id) ? (
                <Check size={14} />
              ) : (
                <ListPlus size={14} />
              )}
            </button>
          ))}
          {error && <small className="error-text">{error}</small>}
        </div>
      )}
    </div>
  );
}
