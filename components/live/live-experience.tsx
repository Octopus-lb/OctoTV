"use client";

import Hls from "hls.js";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ChevronDown,
  LoaderCircle,
  Play,
  Radio,
  Search,
  Star,
  Tv,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { LiveChannel } from "@/lib/live/types";
import { localePath, type Locale } from "@/lib/i18n/config";

type ChannelResponse = {
  channels: LiveChannel[];
  total: number;
  page: number;
  pageSize: number;
  degraded?: boolean;
  facets?: { countries: string[]; categories: string[] };
};

const DEFAULT_COUNTRY_CODES = [
  "SA", "AE", "EG", "MA", "DZ", "TN", "QA", "KW", "JO", "LB", "IQ", "SY", "YE", "OM", "BH", "PS",
  "US", "GB", "FR", "DE", "TR", "NL", "CA", "IT", "ES", "BR", "IN", "JP", "KR", "RU",
];

const DEFAULT_CATEGORIES = [
  "news", "sports", "movies", "music", "kids", "documentary", "general",
  "entertainment", "culture", "education", "religious", "series", "lifestyle",
  "science", "business", "travel", "weather", "family",
];

function displayName(code: string, locale: Locale) {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

function isPlayableSource(url: string) {
  if (typeof window === "undefined") return true;
  try {
    return window.location.protocol !== "https:" || new URL(url, window.location.href).protocol === "https:";
  } catch {
    return false;
  }
}

export function LiveExperience({
  locale,
  compact = false,
  initial,
}: {
  locale: Locale;
  compact?: boolean;
  initial?: ChannelResponse;
}) {
  const { t } = useI18n();
  const [channels, setChannels] = useState<LiveChannel[]>(initial?.channels ?? []);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [page, setPage] = useState(initial?.page ?? 1);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LiveChannel | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [epg, setEpg] = useState<{ now: { title: string } | null; next: Array<{ title: string }> }>({ now: null, next: [] });
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerError, setPlayerError] = useState("");
  const [facets, setFacets] = useState({
    countries: DEFAULT_COUNTRY_CODES,
    categories: DEFAULT_CATEGORIES,
  });
  const playableSources = useMemo(
    () => selected?.sources
      .map((source, index) => ({ source, index }))
      .filter(({ source }) => isPlayableSource(source.url)) ?? [],
    [selected],
  );

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("octotv_favorites") ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate client-only favorites
      if (Array.isArray(stored)) setFavorites(stored.filter((id): id is string => typeof id === "string"));
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  const load = useCallback(
    async (nextPage: number, append: boolean, signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(nextPage), limit: compact ? "8" : "48" });
      if (country) params.set("country", country);
      if (category) params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      if (compact) params.set("list", "arab");

      try {
        const response = await fetch(`/api/channels?${params.toString()}`, { signal });
        if (!response.ok) throw new Error("channels_unavailable");
        const data = (await response.json()) as ChannelResponse;
        setChannels((current) => (append ? [...current, ...data.channels] : data.channels));
        setTotal(data.total);
        setPage(data.page);
        if (data.facets) {
          setFacets(data.facets);
        }
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") setError(t("common.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [category, compact, country, query, t],
  );

  useEffect(() => {
    if (compact) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void load(1, false, controller.signal);
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [compact, load]);

  useEffect(() => {
    if (!compact) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial compact fetch
    void load(1, false, controller.signal);
    return () => controller.abort();
  }, [compact, load]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset EPG for the new channel
    setEpg({ now: null, next: [] });
    fetch(`/api/channels/${encodeURIComponent(selected.id)}/epg`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const payload = data as { now?: { title: string } | null; next?: Array<{ title: string }> } | null;
        if (payload) setEpg({ now: payload.now ?? null, next: payload.next ?? [] });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    const video = videoRef.current;
    if (!selected || !video) return;
    const source = selected.sources[sourceIndex];
    if (!source) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- surface missing stream source
      setPlayerError(t("live.channelUnavailable"));
      return;
    }
    if (!isPlayableSource(source.url)) {
      const secureAlternative = selected.sources.findIndex((candidate) => isPlayableSource(candidate.url));
      if (secureAlternative >= 0) {
        setSourceIndex(secureAlternative);
        return;
      }
      setPlayerError(t("live.channelUnavailable"));
      return;
    }
    setPlayerError("");
    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl") && !Hls.isSupported()) {
      video.src = source.url;
      void video.play().catch(() => undefined);
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setPlayerError(t("live.channelUnavailable"));
      });
    } else {
      setPlayerError(t("common.error"));
    }

    return () => {
      hls?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [selected, sourceIndex, t]);

  const visible = useMemo(
    () => (favoritesOnly ? channels.filter((channel) => favorites.includes(channel.id)) : channels),
    [channels, favorites, favoritesOnly],
  );

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      try {
        localStorage.setItem("octotv_favorites", JSON.stringify(next));
      } catch {
        // Storage may be disabled.
      }
      return next;
    });
  }

  return (
    <section className={compact ? "live-strip" : "live-page"}>
      {!compact && (
        <div className="filter-bar">
          <label>
            <span>{t("common.country")}</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="">{t("live.allCountries")}</option>
              {facets.countries.map((code) => (
                <option key={code} value={code}>
                  {displayName(code, locale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("common.category")}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t("live.allCategories")}</option>
              {facets.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("live.searchChannel")}
              aria-label={t("live.searchChannel")}
            />
          </label>
          <button
            type="button"
            className={`favorite-filter${favoritesOnly ? " active" : ""}`}
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            <Star size={16} fill={favoritesOnly ? "currentColor" : "none"} />
            {t("live.favorites")}
          </button>
        </div>
      )}

      {loading && <div className="status-box"><LoaderCircle className="spin" size={24} /> {t("common.loading")}</div>}
      {!loading && error && <div className="status-box error"><AlertCircle size={22} /> {error} <button onClick={() => void load(1, false)}>{t("common.retry")}</button></div>}
      {!loading && !error && visible.length === 0 && <div className="status-box">{t("live.noPrograms")}</div>}

      <div className="channel-grid">
        {visible.map((channel) => (
          <div
            className="channel-card"
            key={channel.id}
            role="button"
            tabIndex={0}
            aria-labelledby={`channel-name-${encodeURIComponent(channel.id)} channel-meta-${encodeURIComponent(channel.id)}`}
            onClick={() => {
              setSourceIndex(0);
              setSelected(channel);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setSourceIndex(0);
              setSelected(channel);
            }}
          >
            <span className="channel-logo">
              {channel.logo ? (
                <Image
                  src={channel.logo}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <Tv size={24} />
              )}
            </span>
            <span className="channel-copy">
              <strong id={`channel-name-${encodeURIComponent(channel.id)}`}>{channel.name}</strong>
              <small id={`channel-meta-${encodeURIComponent(channel.id)}`}>
                {[channel.country, channel.categories[0], channel.sources[0]?.quality]
                  .filter(Boolean)
                  .join(" · ") || t("common.live")}
              </small>
            </span>
            <span className="channel-side">
              <button
                type="button"
                className={`favorite-star${favorites.includes(channel.id) ? " active" : ""}`}
                aria-label={t("live.favorites")}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(channel.id);
                }}
              >
                <Star size={15} fill={favorites.includes(channel.id) ? "currentColor" : "none"} />
              </button>
              <span className="channel-play"><Play fill="currentColor" size={14} /></span>
            </span>
          </div>
        ))}
      </div>

      {!compact && visible.length > 0 && channels.length < total && (
        <div className="load-more">
          <button type="button" className="ghost-btn" disabled={loading} onClick={() => void load(page + 1, true)}>
            <ChevronDown size={16} /> {t("common.continue")} ({channels.length}/{total})
          </button>
        </div>
      )}

      {compact && (
        <div className="section-foot">
          <Link href={localePath(locale, "/live")} className="view-all">
            {t("common.viewAll")}
          </Link>
        </div>
      )}

      {!compact && <p className="rights-note">{t("live.rightsNotice")}</p>}

      {selected && (
        <div className="player-overlay" role="dialog" aria-modal="true" aria-label={selected.name}>
          <button className="player-backdrop" aria-label={t("common.close")} onClick={() => setSelected(null)} />
          <div className="player-modal live-modal">
            <div className="player-top">
              <div>
                <span className="live-pill"><b /> {t("player.live")}</span>
                <strong>{selected.name}</strong>
              </div>
              <button onClick={() => setSelected(null)} aria-label={t("common.close")}>
                <X size={21} />
              </button>
            </div>

            <div className="video-shell">
              <video ref={videoRef} controls playsInline autoPlay />
              {playerError && (
                <div className="video-error">
                  <AlertCircle size={25} />
                  <span>{playerError}</span>
                  {selected.sources.length > 1 && (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => setSourceIndex((index) => (index + 1) % selected.sources.length)}
                    >
                      {t("live.tryAlternative")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {(epg.now?.title || epg.next[0]?.title || selected.sources.length > 1) && (
              <div className="live-meta">
                {epg.now?.title && (
                  <div>
                    <small>{t("live.now")}</small>
                    <strong>{epg.now.title}</strong>
                  </div>
                )}
                {epg.next[0]?.title && (
                  <div>
                    <small>{t("live.next")}</small>
                    <strong>{epg.next[0].title}</strong>
                  </div>
                )}
                {playableSources.length > 1 && (
                  <div>
                    <small>{t("live.health")}</small>
                    <strong>{playableSources.length} {t("live.tryAlternative")}</strong>
                  </div>
                )}
              </div>
            )}

            {playableSources.length > 1 && (
              <div className="source-list">
                {playableSources.map(({ source, index }) => (
                  <button
                    key={`${source.url}-${index}`}
                    type="button"
                    className={index === sourceIndex ? "active" : undefined}
                    onClick={() => setSourceIndex(index)}
                  >
                    <Radio size={14} />
                    {source.quality ?? `Source ${index + 1}`}
                  </button>
                ))}
              </div>
            )}

            <p className="rights-note">{t("live.rightsNotice")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
