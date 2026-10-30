"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Info, ListPlus, Play, Star } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { detailPath, watchPath } from "@/lib/catalog/routes";
import { titleBackdrop } from "@/lib/catalog/images";
import type { CatalogTitle } from "@/lib/catalog/types";
import { localePath, type Locale } from "@/lib/i18n/config";

export function HeroShowcase({
  items,
  locale,
}: {
  items: CatalogTitle[];
  locale: Locale;
}) {
  const { t, formatDuration } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (!items.length) return null;
  const featured = items[Math.min(index, items.length - 1)];
  if (!featured) return null;
  const backdrop = titleBackdrop(featured.backdropPath, featured.source);
  const meta = [
    featured.voteAverage ? null : null,
    featured.year,
    featured.runtimeMinutes ? formatDuration(featured.runtimeMinutes) : null,
    featured.genres[0],
  ].filter(Boolean);

  return (
    <section
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {backdrop ? (
        <Image
          className="hero-backdrop"
          src={backdrop}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          priority
          unoptimized
        />
      ) : (
        <>
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-art" aria-hidden="true">
            <span className="planet" />
            <span className="ring ring-one" />
            <span className="ring ring-two" />
            <span className="ship" />
          </div>
        </>
      )}

      <div className="hero-copy">
        <h1>{featured.title}</h1>
        <div className="hero-meta">
          {featured.voteAverage ? (
            <b>
              <Star size={12} fill="currentColor" /> {featured.voteAverage.toFixed(1)}
            </b>
          ) : null}
          {meta.map((value) => (
            <span key={String(value)}>{value}</span>
          ))}
        </div>
        <p>{featured.overview}</p>
        <div className="hero-buttons">
          <Link className="primary-btn" href={localePath(locale, watchPath(featured.type, featured.id))}>
            <Play fill="currentColor" size={18} /> {t("common.watchNow")}
          </Link>
          <Link className="ghost-btn" href={localePath(locale, detailPath(featured.type, featured.id))}>
            <Info size={18} /> {t("home.viewDetailsFor", { title: featured.title })}
          </Link>
          <Link className="ghost-btn icon-only" href={localePath(locale, "/watchlist")} aria-label={t("common.addToList")}>
            <ListPlus size={19} />
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <div className="hero-pager" aria-label="Featured">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === index ? "active" : undefined}
              aria-label={item.title}
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
