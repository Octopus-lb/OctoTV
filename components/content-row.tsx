import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import type { CatalogTitle } from "@/lib/catalog/types";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/config";

export function ContentRow({
  title,
  items,
  locale,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  items: CatalogTitle[];
  locale: Locale;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="content-section row-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link
            href={localePath(locale, viewAllHref)}
            className="view-all"
            aria-label={`${viewAllLabel} ${title}`}
          >
            {viewAllLabel}
            {locale === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Link>
        ) : null}
      </div>
      <div className="media-row">
        {items.map((item, index) => (
          <MediaCard key={item.id} item={item} locale={locale} index={index} />
        ))}
      </div>
    </section>
  );
}
