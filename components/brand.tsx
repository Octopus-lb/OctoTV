import Link from "next/link";
import { Play } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/config";

export function Brand({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <Link
      href={localePath(locale)}
      className="brand"
      aria-label="OctoTV"
      style={compact ? { letterSpacing: 2 } : undefined}
    >
      <span className="brand-mark">
        <Play fill="currentColor" size={15} />
      </span>
      <span>OCTOTV</span>
    </Link>
  );
}
