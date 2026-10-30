import Link from "next/link";
import { Clapperboard, Drama, Ghost, Rocket, Smile, Sparkles } from "lucide-react";
import { createTranslator } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

const TONES = ["#8b5cf6", "#f97316", "#eab308", "#14b8a6", "#ec4899", "#3b82f6"];

const ICONS = [Rocket, Smile, Drama, Ghost, Sparkles, Clapperboard];

export function GenreGrid({
  locale,
  genres,
}: {
  locale: Locale;
  genres: Array<{ name: string; count: number }>;
}) {
  const { t } = createTranslator(locale);
  if (!genres.length) return null;

  return (
    <section className="content-section genre-section">
      <div className="section-heading">
        <div>
          <span className="kicker">{t("common.genres")}</span>
          <h2>{t("home.browseByGenre")}</h2>
        </div>
      </div>
      <div className="genre-grid">
        {genres.slice(0, 6).map((genre, index) => {
          const Icon = ICONS[index % ICONS.length] ?? Sparkles;
          return (
            <Link
              key={genre.name}
              href={localePath(locale, `/movies?genre=${encodeURIComponent(genre.name)}`)}
              className="genre-card"
              style={{ "--genre": TONES[index % TONES.length], "--i": index } as React.CSSProperties}
            >
              <Icon size={22} />
              <strong>{genre.name}</strong>
              <span>{t("home.stat.everyone", { count: genre.count })}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
