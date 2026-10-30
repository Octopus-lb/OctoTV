"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Baby, Check, LoaderCircle, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { localePath, type Locale } from "@/lib/i18n/config";

export type ProfileSummary = {
  id: string;
  name: string;
  avatar: string | null;
  isKids: boolean;
};

export function ProfileManager({
  locale,
  initial,
  activeId,
}: {
  locale: Locale;
  initial: ProfileSummary[];
  activeId: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [profiles, setProfiles] = useState(initial);
  const [active, setActive] = useState(activeId);
  const [editMode, setEditMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function select(profile: ProfileSummary) {
    setBusy(profile.id);
    setError("");
    try {
      const response = await fetch("/api/profiles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      if (!response.ok) throw new Error("failed");
      setActive(profile.id);
      if (!editMode) {
        router.push(localePath(locale));
        router.refresh();
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy("");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy("create");
    setError("");
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), preferredLocale: locale }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { profile: ProfileSummary };
      setProfiles((current) => [...current, { ...data.profile, avatar: null, isKids: false }]);
      setCreating(false);
      setName("");
    } catch {
      setError(t("profiles.limit"));
    } finally {
      setBusy("");
    }
  }

  async function rename(profile: ProfileSummary) {
    const next = window.prompt(t("profiles.name"), profile.name);
    if (!next || !next.trim() || next.trim() === profile.name) return;
    setBusy(profile.id);
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      if (!response.ok) throw new Error("failed");
      setProfiles((current) =>
        current.map((item) => (item.id === profile.id ? { ...item, name: next.trim() } : item)),
      );
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy("");
    }
  }

  async function remove(profile: ProfileSummary) {
    if (!window.confirm(t("profiles.deleteConfirm"))) return;
    setBusy(profile.id);
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("failed");
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      if (active === profile.id) setActive(null);
    } catch {
      setError(t("profiles.delete"));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="profile-manager">
      <div className="profile-head">
        <h1>{editMode ? t("profiles.manage") : t("profiles.choose")}</h1>
        <button type="button" className="ghost-btn small" onClick={() => setEditMode((value) => !value)}>
          {editMode ? t("profiles.choose") : t("profiles.manage")}
        </button>
      </div>

      <div className="profile-grid">
        {profiles.map((profile) => (
          <div key={profile.id} className={`profile-tile${active === profile.id ? " active" : ""}`}>
            <button type="button" className="profile-pick" onClick={() => void select(profile)} disabled={busy === profile.id}>
              <span className="profile-avatar">
                {busy === profile.id ? (
                  <LoaderCircle className="spin" size={26} />
                ) : (
                  <UserRound size={34} />
                )}
                {profile.isKids && <Baby className="kids-badge" size={15} />}
              </span>
              <strong>{profile.name}</strong>
              {active === profile.id && <Check size={15} />}
            </button>
            {editMode && (
              <div className="profile-tile-actions">
                <button type="button" aria-label={t("profiles.edit")} onClick={() => void rename(profile)}>
                  <Pencil size={14} />
                </button>
                {profiles.length > 1 && (
                  <button type="button" aria-label={t("profiles.delete")} onClick={() => void remove(profile)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {profiles.length < 5 && !creating && (
          <button type="button" className="profile-tile profile-add" onClick={() => setCreating(true)}>
            <span className="profile-avatar">
              <Plus size={28} />
            </span>
            <strong>{t("profiles.add")}</strong>
          </button>
        )}
      </div>

      {creating && (
        <form className="profile-create" onSubmit={create}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("profiles.name")}
            maxLength={40}
            autoFocus
          />
          <button type="submit" className="primary-btn small" disabled={busy === "create"}>
            {t("common.save")}
          </button>
          <button type="button" className="ghost-btn small" onClick={() => setCreating(false)}>
            {t("common.cancel")}
          </button>
        </form>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="muted-text">{t("profiles.limit")}</p>
    </div>
  );
}
