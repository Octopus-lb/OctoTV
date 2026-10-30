import Image from "next/image";
import { Play } from "lucide-react";
import { titlePoster } from "@/lib/catalog/images";
import type { CatalogTitle } from "@/lib/catalog/types";
import { toneFor } from "@/lib/ui/tone";

/**
 * Poster artwork with a CSS fallback. TMDB paths get responsive candidates;
 * AniList URLs are already complete and are used as supplied.
 */
export function PosterArt({
  title,
  size = "w342",
  priority = false,
  showTitle = true,
}: {
  title: Pick<CatalogTitle, "id" | "title" | "posterPath" | "source" | "isDemo">;
  size?: "w185" | "w342" | "w500" | "w780";
  priority?: boolean;
  showTitle?: boolean;
}) {
  const src = titlePoster(title.posterPath, title.source, size);
  const tone = toneFor(title.id);
  return (
    <span className={`poster poster-${tone}${src ? " has-image" : ""}`}>
      {src ? (
        <Image
          className="poster-img"
          src={src}
          sizes="(max-width: 760px) 145px, (max-width: 1050px) 170px, 220px"
          alt={title.title}
          fill
          unoptimized
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <>
          <span className="poster-noise" />
          <span className="poster-orbit" />
        </>
      )}
      <span className="poster-shade" aria-hidden="true" />
      {showTitle && !src && <span className="poster-title">{title.title}</span>}
      {title.isDemo && <span className="demo-badge">DEMO</span>}
      <span className="poster-play" aria-hidden="true">
        <Play fill="currentColor" size={18} />
      </span>
    </span>
  );
}
