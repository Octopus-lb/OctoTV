import Link from "next/link";
import {
  BadgeAlert,
  BookOpenText,
  Clapperboard,
  Compass,
  Drama,
  Ghost,
  Heart,
  Landmark,
  Laugh,
  Mountain,
  Music2,
  MessagesSquare,
  Rocket,
  Search,
  Shield,
  Swords,
  Tv,
  UsersRound,
  WandSparkles,
  Zap,
} from "lucide-react";
import { createTranslator } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

const GENRE_ICONS = {
  action: Swords,
  adventure: Compass,
  animation: Clapperboard,
  comedy: Laugh,
  crime: BadgeAlert,
  documentary: BookOpenText,
  drama: Drama,
  family: UsersRound,
  fantasy: WandSparkles,
  history: Landmark,
  horror: Ghost,
  music: Music2,
  mystery: Search,
  news: BookOpenText,
  politics: Landmark,
  reality: Tv,
  romance: Heart,
  "science fiction": Rocket,
  "sci-fi": Rocket,
  thriller: Zap,
  war: Shield,
  "war & politics": Shield,
  western: Mountain,
  supernatural: Ghost,
  talk: MessagesSquare,
} as const;

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
          const Icon = GENRE_ICONS[genre.name.trim().toLowerCase() as keyof typeof GENRE_ICONS] ?? Clapperboard;
          return (
            <Link
              key={genre.name}
              href={localePath(locale, `/movies?genre=${encodeURIComponent(genre.name)}`)}
              className="genre-card"
              style={{ "--i": index } as React.CSSProperties}
            >
              <span className="genre-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <strong>{genre.name}</strong>
              <span>{t("home.stat.everyone", { count: genre.count })}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
