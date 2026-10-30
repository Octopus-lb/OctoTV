import { notFound } from "next/navigation";
import { TitleDetailView } from "@/components/title-detail";
import { getTitleDetail } from "@/lib/catalog/service";
import { isInWatchlist } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const detail = await getTitleDetail(id, locale, "movie");
  if (!detail) notFound();

  const viewer = await getViewer();
  const inWatchlist = viewer
    ? await isInWatchlist(viewer.profile.id, detail.id)
    : false;

  return (
    <TitleDetailView
      detail={detail}
      locale={locale}
      type="movie"
      inWatchlist={inWatchlist}
    />
  );
}
