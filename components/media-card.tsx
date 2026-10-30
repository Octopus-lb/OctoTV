import Link from "next/link";
import { Star } from "lucide-react";
import { PosterArt } from "@/components/poster-art";
import { detailPath } from "@/lib/catalog/routes";
import type { CatalogTitle } from "@/lib/catalog/types";
import { localePath, type Locale } from "@/lib/i18n/config";

export function MediaCard({
  item,
  locale,
  index = 0,
  priority = false,
}: {
  item: CatalogTitle;
  locale: Locale;
  index?: number;
  priority?: boolean;
}) {
  const meta = [item.year, item.genres[0]].filter(Boolean).join(" · ");
  return (
    <Link
      href={localePath(locale, detailPath(item.type, item.id))}
      className="media-card"
      style={{ "--i": index } as React.CSSProperties}
    >
      <PosterArt title={item} priority={priority} />
      <span className="card-copy">
        <strong>{item.title}</strong>
        <small>{meta || item.originalTitle}</small>
      </span>
      {item.voteAverage ? (
        <span className="score">
          <Star size={10} fill="currentColor" /> {item.voteAverage.toFixed(1)}
        </span>
      ) : null}
    </Link>
  );
}
