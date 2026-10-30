const CUES = {
  ar: [
    "مرحبًا بك في OctoTV.",
    "هذا تدفق اختبار عام يُستخدم للتحقق من المشغّل فقط.",
    "اختر الجودة والترجمة من قائمة الإعدادات.",
  ],
  en: [
    "Welcome to OctoTV.",
    "This is a public player test stream, used only to verify playback.",
    "Choose quality and subtitles from the settings menu.",
  ],
  tr: [
    "OctoTV'ye hoş geldiniz.",
    "Bu, yalnızca oynatmayı doğrulamak için kullanılan herkese açık bir test akışıdır.",
    "Kaliteyi ve altyazıları ayarlar menüsünden seçin.",
  ],
  fr: [
    "Bienvenue sur OctoTV.",
    "Ceci est un flux de test public, utilisé uniquement pour vérifier la lecture.",
    "Choisissez la qualité et les sous-titres dans le menu des paramètres.",
  ],
} as const;

type CueLocale = keyof typeof CUES;

export function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "en";
  const locale: CueLocale = (Object.keys(CUES) as CueLocale[]).includes(lang as CueLocale)
    ? (lang as CueLocale)
    : "en";
  const lines = CUES[locale];

  const body = [
    "WEBVTT",
    "",
    ...lines.flatMap((line, index) => [
      `${index + 1}`,
      `${String(index * 4).padStart(2, "0")}:00.000 --> ${String(index * 4 + 3).padStart(2, "0")}:00.000`,
      line,
      "",
    ]),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Language": locale,
    },
  });
}
