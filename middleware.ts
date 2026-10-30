import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  resolveLocaleFromAcceptLanguage,
  type Locale,
} from "@/lib/i18n/config";
import { isSameOriginRequest } from "@/lib/security/origin";

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|js|css|map|woff2?)$/i;

function detectLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return (
    resolveLocaleFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
      !isSameOriginRequest(request)
    ) {
      return NextResponse.json({ error: "cross_origin_request_denied" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/");
  const first = segments[1];

  if (isLocale(first)) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const locale = detectLocale(request);
  const target = new URL(
    `/${locale}${pathname === "/" ? "" : pathname}${search}`,
    request.url,
  );
  const response = NextResponse.redirect(target);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
