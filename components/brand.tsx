import Link from "next/link";
import Image from "next/image";
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
        <Image src="/octotv-emblem.png" alt="" width={40} height={40} />
      </span>
      <span>OCTOTV</span>
    </Link>
  );
}
