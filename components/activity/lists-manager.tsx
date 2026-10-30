"use client";

import { useState } from "react";
import { ListPlus, LoaderCircle, Trash2 } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { useI18n } from "@/components/i18n-provider";
import type { CatalogTitle } from "@/lib/catalog/types";
import type { Locale } from "@/lib/i18n/config";

type ListSummary = { id: string; name: string; description: string | null };

export function ListsManager({
  locale,
  initial,
}: {
  locale: Locale;
  initial: ListSummary[];
}) {
  const { t } = useI18n();
  const [lists, setLists] = useState(initial);
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null);
  const [items, setItems] = useState<CatalogTitle[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadItems(listId: string) {
    setSelected(listId);
    setItems(null);
    try {
      const response = await fetch(`/api/lists/${listId}/items`);
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { items: CatalogTitle[] };
      setItems(data.items);
    } catch {
      setError(t("common.error"));
      setItems([]);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { id: string };
      const created = { id: data.id, name: name.trim(), description: null };
      setLists((current) => [created, ...current]);
      setName("");
      setCreating(false);
      await loadItems(created.id);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(titleId: string) {
    if (!selected) return;
    await fetch(`/api/lists/${selected}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId }),
    }).catch(() => undefined);
    setItems((current) => current?.filter((item) => item.id !== titleId) ?? null);
  }

  return (
    <div className="lists-layout">
      <aside className="lists-sidebar">
        <div className="lists-head">
          <h2>{t("common.myLists")}</h2>
          <button type="button" className="icon-btn" aria-label={t("activity.createList")} onClick={() => setCreating((value) => !value)}>
            <ListPlus size={17} />
          </button>
        </div>

        {creating && (
          <form className="list-create-form" onSubmit={create}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("activity.listName")}
              maxLength={80}
              autoFocus
            />
            <button type="submit" className="primary-btn small" disabled={busy}>
              {t("common.save")}
            </button>
          </form>
        )}

        {lists.length === 0 && !creating && (
          <p className="muted-text">{t("activity.listsEmpty")}</p>
        )}
        <div className="list-buttons">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              className={selected === list.id ? "active" : undefined}
              onClick={() => void loadItems(list.id)}
            >
              {list.name}
            </button>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
      </aside>

      <div className="lists-content">
        {!selected && (
          <div className="empty-state">
            <ListPlus size={26} />
            <strong>{t("activity.listsEmpty")}</strong>
            <button type="button" className="primary-btn" onClick={() => setCreating(true)}>
              {t("activity.createList")}
            </button>
          </div>
        )}
        {selected && !items && (
          <div className="status-box">
            <LoaderCircle className="spin" size={20} /> {t("common.loading")}
          </div>
        )}
        {selected && items?.length === 0 && (
          <div className="empty-state">
            <ListPlus size={26} />
            <strong>{t("activity.listsEmpty")}</strong>
            <p>{t("common.addToList")}</p>
          </div>
        )}
        {items && items.length > 0 && (
          <div className="media-grid">
            {items.map((item, index) => (
              <div key={item.id} className="list-item">
                <MediaCard item={item} locale={locale} index={index} />
                <button
                  type="button"
                  className="icon-btn list-remove"
                  aria-label={t("common.removeFromList")}
                  onClick={() => void removeItem(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
