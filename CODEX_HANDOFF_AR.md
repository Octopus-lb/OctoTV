# OctoTV — Full Codex Handoff

## 0. مهمة Codex

طوّر **OctoTV** إلى منصة بث متعددة اللغات مستوحاة من تجربة Movy من حيث سهولة الاستخدام، الصفحات، البحث، الفلاتر والمشغّل، من دون نسخ شعار Movy أو كوده أو أصوله أو ربط مصادر أفلام غير مرخّصة.

الموقع الحالي:

- Site project ID: `appgprj_6ae4587b5be88191a43ef49002788dc9`
- Live URL: `https://nova-stream-live.invizion-3051.chatgpt.site`
- الاسم المعروض: **OctoTV**
- الجمهور الحالي: خاص بالمالك. حافظ على الجمهور ما لم يطلب المالك تغييره.
- الكود الحالي مبني بـNext.js/Vinext ويحتوي واجهة عربية وقسم Live TV ومشغّل HLS.

لا تنشئ Site جديدًا. استخدم المشروع أعلاه وافتح مصدره عبر Sites ثم عدّله وانشر نسخة جديدة.

---

## 1. هدف المنتج

منصة بث حديثة تشمل:

1. أفلام.
2. مسلسلات ومواسم وحلقات.
3. أنمي.
4. قنوات تلفزيونية مباشرة.
5. حسابات شخصية وملفات مشاهدة متعددة.
6. سجل المشاهدة وContinue Watching.
7. قوائم مفضلة وقوائم مخصصة.
8. بحث شامل وفلاتر وترتيب.
9. واجهة عربية وإنجليزية وتركية وفرنسية.
10. تحديث الكتالوج والقنوات والبرامج تلقائيًا.

التصميم داكن وسينمائي، سريع، متجاوب، وقريب في بنية التجربة من Movy، مع هوية OctoTV أصلية.

---

## 2. نتيجة تحليل الموقع المرجعي Movy

المعلومات التالية رُصدت من الواجهة والطلبات العامة للموقع المرجعي، وتُستخدم لفهم المعمارية فقط:

- الواجهة: Next.js + React، مع SSR/SSG و`/_next/data/...`.
- الأفلام والمسلسلات تستخدم معرّفات TMDB، وتظهر أيضًا IMDb IDs.
- طلبات الميتاداتا رُصدت على مسارات تشبه TMDB v3 مثل `/3/movie/{id}` و`/3/tv/{id}` و`/3/discover/movie`.
- الموقع يذكر TMDB وAniList في شروطه كمصادر بيانات/صور.
- الأنمي يعتمد معرّفات AniList ومصادر صور خارجية.
- المقاطع الدعائية مرتبطة بمعرّفات YouTube.
- خدمة المشغّل المرتبطة من تذييل الموقع هي Vidy.
- وثائق Vidy العامة تصف مسارات تعتمد TMDB ID للأفلام والمسلسلات وAniList ID للأنمي، وتعيد أحداث play/pause/timeupdate للصفحة الأم.
- الفيديو داخل المشغّل ظهر كـ`blob:`، ما يشير إلى MediaSource/HLS أو تدفّق مجزأ بدل رابط MP4 ظاهر.
- الحسابات والكتالوج والمفضلة والسجل منفصلة عن المشغّل.
- الموقع يعرض عدة خوادم وجودات وترجمة OpenSubtitles وتنزيلًا محدودًا.

### قيد إلزامي

لا تدمج Vidy أو أي مصدر أفلام غير موثّق في الإنتاج إلا بعد أن يقدّم المالك عقدًا أو تصريحًا كتابيًا يثبت حق عرض المحتوى. لا تستخرج روابط الفيديو، ولا تنسخ منطق البحث عن مصادر أفلام محمية، ولا تتجاوز الحماية.

ابنِ بدلًا من ذلك واجهة مزوّد فيديو قابلة للاستبدال:

```ts
interface PlaybackProvider {
  getMovieSources(contentId: string): Promise<PlaybackSource[]>;
  getEpisodeSources(contentId: string, season: number, episode: number): Promise<PlaybackSource[]>;
  getDownloadOptions?(contentId: string): Promise<DownloadOption[]>;
}

type PlaybackSource = {
  id: string;
  label: string;
  url: string;
  protocol: "hls" | "dash" | "mp4";
  quality?: "2160p" | "1080p" | "720p" | "480p";
  audioLanguage?: string;
  subtitles?: SubtitleTrack[];
};
```

نفّذ `DemoPlaybackProvider` بمقاطع ملكية عامة، وجهّز adapters لمزوّد مرخّص مثل Mux أو Cloudflare Stream أو Bunny Stream أو مكتبة يملكها العميل.

---

## 3. مصادر البيانات المعتمدة

### 3.1 الأفلام والمسلسلات — الميتاداتا

استخدم TMDB API v3 رسميًا:

- Documentation: `https://developer.themoviedb.org/docs/getting-started`
- احتفظ بـTMDB token على الخادم فقط.
- استخدم Discover وTrending وSearch وMovie/TV Details وCredits وRecommendations وImages وVideos وTranslations وWatch Providers.
- خزّن `tmdb_id` كمفتاح المصدر الخارجي، ولا تستخدم عنوان العمل كمفتاح.
- اعرض attribution المطلوبة من TMDB في صفحة About/Credits.
- إذا كان المشروع تجاريًا، يجب أن يحصل المالك على الترخيص التجاري المناسب من TMDB.

### 3.2 الأنمي

استخدم AniList GraphQL للبيانات العامة:

- Endpoint: `https://graphql.anilist.co`
- Documentation: `https://docs.anilist.co/guide/graphql/`
- استخدم POST مع `query` و`variables`.
- لا تحتاج OAuth لقراءة بيانات الأنمي العامة.
- خزّن `anilist_id` وأسماء العنوان متعددة اللغات وعدد الحلقات والحالة والمواسم.

### 3.3 القنوات المباشرة

المصدر الأساسي:

- Main playlist: `https://iptv-org.github.io/iptv/index.m3u`
- Arabic region: `https://iptv-org.github.io/iptv/regions/arab.m3u`
- Netherlands: `https://iptv-org.github.io/iptv/countries/nl.m3u`
- Categories: `https://iptv-org.github.io/iptv/categories/{category}.m3u`
- API channels: `https://iptv-org.github.io/api/channels.json`
- API streams: `https://iptv-org.github.io/api/streams.json`
- API logos: `https://iptv-org.github.io/api/logos.json`
- API guides: `https://iptv-org.github.io/api/guides.json`
- EPG project: `https://github.com/iptv-org/epg`

قواعد التنفيذ:

- حدّث بيانات IPTV-org دوريًا ولا تخزّن نسخة ثابتة قديمة.
- اربط `streams.channel` مع `channels.id` ثم logos/guides.
- استبعد `is_nsfw=true` وأي قناة في blocklist.
- اعرض شارات Geo-blocked وNot 24/7 والجودة واللغة والدولة.
- استخدم HLS.js للمتصفحات غير الداعمة لـHLS، وNative HLS على Safari.
- اتصل بمصدر القناة مباشرة متى كان CORS يسمح بذلك.
- لا تعمل كـvideo proxy عام. Proxy محدود ومصرّح فقط إذا اقتضت الحاجة وبقائمة نطاقات مسموح بها.
- افشل بأمان عند تعطل القناة، مع زر تجربة مصدر بديل.

---

## 4. المعمارية المستهدفة

### Frontend

- Next.js حديث مع TypeScript.
- Server Components للكتالوج وClient Components للمشغّل والتفاعلات.
- CSS/Tailwind مع design tokens خاصة بـOctoTV.
- `next-intl` أو حل i18n مكافئ.
- HLS.js للمباشر وHLS المرخّص.
- PWA manifest وservice worker اختياري في المرحلة الثانية.

### Backend

- Route Handlers/Worker APIs.
- PostgreSQL أو Cloudflare D1 حسب منصة النشر.
- ORM: Drizzle.
- Object storage للصور التي يملكها العميل فقط.
- Redis/KV اختياري للكاش وrate limiting.
- Queue أو scheduled jobs لمزامنة الكتالوج.

### فصل المسؤوليات

```text
TMDB / AniList ──> Catalog Sync ──> Database ──> OctoTV UI
IPTV-org ─────────> Live TV Sync ──> Cache ─────> HLS Player
Licensed Media ───> Playback Adapter ───────────> Movie/TV Player
Google / Email ───> Auth Service ──> Users/Sessions/Profiles
Email Provider ───> Verification + Password Reset
```

---

## 5. اللغات والتوطين

اللغات المطلوبة:

- العربية: `ar`, اتجاه RTL.
- الإنجليزية: `en`, اتجاه LTR.
- التركية: `tr`, اتجاه LTR.
- الفرنسية: `fr`, اتجاه LTR.

المتطلبات:

- URLs مفضلة: `/ar`, `/en`, `/tr`, `/fr`.
- اكتشاف اللغة من cookie ثم Accept-Language، مع مبدّل واضح في الحساب والتذييل.
- خزّن اختيار المستخدم في الحساب وcookie.
- كل النصوص في ملفات رسائل، ممنوع hard-coded strings في المكونات.
- بدّل `dir` على عنصر `<html>` حسب اللغة.
- استخدم حقول TMDB translations والعناوين الأصلية عند توفرها.
- fallback: لغة الواجهة المطلوبة → الإنجليزية → العنوان الأصلي.
- نسّق التاريخ والأرقام والمدة عبر Intl APIs.
- راجع عدم انكسار البطاقات مع النصوص الطويلة بالفرنسية والتركية.

---

## 6. تسجيل الدخول وتأكيد الحساب

استخدم **Better Auth** أو مكتبة مصادقة ناضجة مكافئة. Better Auth يدعم email/password وGoogle وemail verification.

### طرق الدخول

1. Google OAuth.
2. البريد الإلكتروني + كلمة مرور.

### Google

- أنشئ Google OAuth Web Client.
- خزّن `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` كأسرار خادم.
- استخدم callback رسميًا.
- لا تنشئ جلسة إذا لم يرجع Google `email_verified=true`.
- اطلب أقل scopes ممكنة: `openid email profile`.
- عالج ربط حساب Google بحساب بريد موجود فقط بعد التحقق من البريد ومنع account takeover.

### البريد وكلمة المرور

- التسجيل: الاسم + البريد + كلمة المرور + قبول الشروط.
- الحد الأدنى 10 أحرف مع فحص كلمات المرور المسرّبة إن أمكن.
- hash: Argon2id، أو scrypt عند عدم توفر Argon2id.
- `email_verified_at` يبدأ NULL.
- لا تسمح بتسجيل الدخول الكامل قبل تأكيد البريد.
- أرسل رابط تحقق موقّعًا، one-time، بصلاحية 30–60 دقيقة.
- خزّن hash للتوكن، لا تخزّن التوكن الصريح.
- resend verification مع cooldown وrate limit.
- اجعل رسالة النجاح متطابقة للبريد الموجود وغير الموجود لمنع user enumeration.
- بعد التأكيد: حدّث `email_verified_at`، أبطل التوكن، ثم اسمح بإنشاء الجلسة.
- نفّذ Forgot Password وReset Password بتوكن one-time قصير العمر.

### البريد المرسل

- Resend أو Postmark أو AWS SES.
- قوالب رسائل للأربع لغات.
- إعداد SPF وDKIM وDMARC للنطاق.
- الروابط تستخدم base URL للإنتاج فقط.

### الجلسات والأمان

- cookies: HttpOnly, Secure, SameSite=Lax.
- تدوير session id بعد تسجيل الدخول.
- CSRF protection.
- rate limits للتسجيل والدخول وإرسال البريد وإعادة الإرسال.
- audit log لمحاولات الدخول والتغييرات الأمنية.
- صفحة Devices/Sessions وإمكانية تسجيل الخروج من كل الأجهزة.
- 2FA/TOTP وPasskeys كميزات موصى بها للمرحلة الثانية.

---

## 7. نموذج البيانات المقترح

```text
users
  id, email, email_verified_at, name, avatar_url, preferred_locale,
  created_at, updated_at, disabled_at

accounts
  id, user_id, provider, provider_account_id, access_token_encrypted,
  refresh_token_encrypted, expires_at

credentials
  user_id, password_hash, password_changed_at

verification_tokens
  id, user_id, token_hash, purpose, expires_at, consumed_at, created_at

sessions
  id, user_id, token_hash, ip_hash, user_agent, expires_at, last_seen_at

profiles
  id, user_id, name, avatar, pin_hash_nullable, preferred_locale, maturity_level

content
  id, type(movie|tv|anime), tmdb_id_nullable, anilist_id_nullable,
  imdb_id_nullable, original_title, original_language, release_date,
  status, runtime_minutes, poster_path, backdrop_path, metadata_json,
  source_updated_at, synced_at

content_translations
  content_id, locale, title, overview, tagline

seasons
  id, content_id, season_number, title, episode_count, air_date, poster_path

episodes
  id, season_id, episode_number, title, overview, runtime_minutes, air_date, still_path

genres / content_genres

playback_assets
  id, content_id_or_episode_id, provider, external_asset_id, status,
  quality, audio_language, license_starts_at, license_ends_at

watch_progress
  profile_id, content_id, episode_id_nullable, position_seconds,
  duration_seconds, completed, updated_at

watchlist_items
  profile_id, content_id, created_at

custom_lists / custom_list_items

ratings
  profile_id, content_id, value(up|down), created_at

live_channels
  id, iptv_org_channel_id, name, country, languages_json, categories_json,
  logo_url, is_nsfw, enabled, synced_at

live_streams
  id, channel_id, url, quality, referrer_nullable, user_agent_nullable,
  labels_json, last_checked_at, health_status

epg_programs
  channel_id, starts_at, ends_at, title, description, locale
```

أضف unique indexes على identifiers الخارجية، وindexes على search/filter/schedule fields.

---

## 8. صفحات المنتج

### عامة

- `/[locale]` الصفحة الرئيسية.
- `/[locale]/movies`
- `/[locale]/shows`
- `/[locale]/anime`
- `/[locale]/live`
- `/[locale]/search`
- `/[locale]/movie/[id]`
- `/[locale]/show/[id]`
- `/[locale]/anime/[id]`
- `/[locale]/watch/[type]/[id]`
- `/[locale]/legal/terms`
- `/[locale]/legal/privacy`
- `/[locale]/legal/dmca`
- `/[locale]/about/credits`

### الحساب

- `/[locale]/auth/sign-in`
- `/[locale]/auth/sign-up`
- `/[locale]/auth/verify-email`
- `/[locale]/auth/forgot-password`
- `/[locale]/auth/reset-password`
- `/[locale]/profiles`
- `/[locale]/account`
- `/[locale]/account/security`
- `/[locale]/account/devices`
- `/[locale]/history`
- `/[locale]/watchlist`
- `/[locale]/lists/[id]`

---

## 9. API المطلوبة

```text
GET  /api/catalog/home?locale=&region=
GET  /api/catalog/search?q=&type=&page=&locale=
GET  /api/catalog/discover?type=&genre=&year=&country=&sort=&page=
GET  /api/catalog/:type/:id?locale=
GET  /api/catalog/:type/:id/recommendations

GET  /api/playback/:type/:id
GET  /api/playback/tv/:id/:season/:episode
POST /api/progress
GET  /api/progress/:profileId

GET  /api/live/channels?country=&language=&category=&q=&page=
GET  /api/live/channels/:id/streams
GET  /api/live/channels/:id/epg

POST /api/auth/sign-up
POST /api/auth/sign-in
GET  /api/auth/google
GET  /api/auth/google/callback
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/sign-out
GET  /api/auth/sessions
DELETE /api/auth/sessions/:id
```

لا ترجع أسرار مزوّد الفيديو أو refresh tokens إلى العميل.

---

## 10. التحديثات الآلية

### كل 30 دقيقة

- تحديث IPTV playlists/API.
- دمج القنوات والشعارات والمصادر والـlabels.
- فحص محدود لصحة المصادر مع timeouts واحترام المعدلات.

### كل 6 ساعات

- TMDB trending وnow playing وpopular وon the air.
- تحديث الصفحات الأولى والأعمال التي تغيّرت.

### يوميًا

- اكتشاف أفلام ومسلسلات جديدة.
- تحديث upcoming releases والمواسم والحلقات.
- تحديث AniList seasonal/trending.
- مزامنة EPG.
- تنظيف verification tokens والجلسات المنتهية.

### استراتيجية المزامنة

- upsert idempotent.
- احتفظ بـ`source_updated_at` و`synced_at`.
- لا تحذف فورًا عند اختفاء المصدر؛ استخدم soft disable ثم حذف بعد فترة سماح.
- retries مع exponential backoff.
- logs ومقاييس: عدد العناصر، الأخطاء، مدة المهمة، آخر نجاح.
- لوحة admin تعرض آخر مزامنة وحالة كل مصدر.

---

## 11. تجربة المستخدم المطلوبة

- Hero carousel قابل للإيقاف ويحترم reduced motion.
- صفوف: Trending, Top Rated, New Releases, Continue Watching, For You.
- صفحة تفاصيل تشمل الخلفية والملصق والتقييم والسنة والمدة والتصنيف والوصف والممثلين والمقترحات.
- زر Play يظهر فقط عند وجود `PlaybackAsset` صالح ومرخّص.
- للمسلسلات: season picker وepisode list والبحث في الحلقات وAuto Next.
- المشغّل: جودة، صوت، ترجمة، سرعة، fullscreen، picture-in-picture، next episode.
- رفع ترجمة محلية يبقى في جهاز المستخدم ولا يُرفع للخادم إلا بموافقة صريحة.
- Live TV: فلاتر الدولة/اللغة/الفئة، البحث، الشعار، الجودة، EPG، مصادر بديلة.
- حفظ progress كل 10–15 ثانية وعند pause/ended/pagehide.
- ملفات متعددة لكل حساب مع PIN اختياري وتصنيف عمري.

---

## 12. توصيات ميزات إضافية

الأولوية العالية:

1. EPG: الآن/التالي ودليل يومي للقنوات.
2. Continue Watching ومزامنة الأجهزة.
3. Profiles مع PIN والرقابة الأبوية.
4. قوائم مخصصة قابلة للمشاركة.
5. تنبيهات حلقات جديدة للمفضلة.
6. زر Report broken stream.
7. لوحة Admin للمزامنة والقنوات والأصول المرخّصة.

المرحلة الثانية:

- Watch Party قانوني للمحتوى المملوك.
- Chromecast/AirPlay حيث يسمح المصدر.
- PWA وتنزيلات Offline DRM من المزوّد المرخّص فقط.
- Passkeys و2FA.
- Recommendations تعتمد history والgenres مع إمكانية تعطيل personalization.
- Kids mode.
- Smart TV navigation ودعم remote control.
- Accessibility: keyboard, captions, audio descriptions, WCAG AA.
- SEO وstructured data للأعمال العامة.
- Health dashboard وerror analytics وSentry/OpenTelemetry.

---

## 13. متغيرات البيئة

```text
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
TMDB_API_READ_TOKEN=
ANILIST_GRAPHQL_URL=https://graphql.anilist.co
IPTV_PLAYLIST_URL=https://iptv-org.github.io/iptv/index.m3u
APP_BASE_URL=
PLAYBACK_PROVIDER=demo
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

لا تضع أي secret في Git أو Client bundle.

---

## 14. خطة التنفيذ

### Phase 1 — الأساس

- إعادة تنظيم المشروع والـdesign system.
- i18n للأربع لغات وRTL.
- قاعدة البيانات والمigrations.
- Better Auth + Google + email/password + email verification.
- صفحات التسجيل والتحقق والاستعادة.

### Phase 2 — الكتالوج

- TMDB/AniList adapters.
- scheduled sync وcache.
- صفحات Home/Browse/Search/Details.
- attribution وCredits.

### Phase 3 — المشاهدة

- PlaybackProvider abstraction.
- Demo licensed/public-domain assets.
- Player، subtitles، progress، Auto Next.
- Profiles، history، watchlist، custom lists.

### Phase 4 — Live TV

- IPTV-org API ingestion.
- فلاتر ودول ولغات وفئات.
- HLS player، fallback streams، EPG، health status.

### Phase 5 — الجودة والإطلاق

- security review وrate limits.
- responsive QA لأحجام mobile/tablet/desktop/TV.
- accessibility وperformance budgets.
- observability وbackup/restore.
- سياسات Privacy/Terms/DMCA واضحة.

---

## 15. معايير القبول

- الاسم OctoTV في العنوان والشعار والmetadata ورسائل البريد.
- اللغات `ar/en/tr/fr` كاملة، والعربية RTL بلا مشاكل تخطيط.
- Google login لا يقبل بريدًا غير موثّق.
- email/password لا يسمح بالدخول قبل الضغط على رابط التحقق.
- رابط التحقق one-time وينتهي خلال ساعة.
- لا توجد secrets في الواجهة أو المستودع.
- TMDB/AniList sync آمن وidempotent.
- تحديث القنوات يعمل تلقائيًا مع إظهار آخر مزامنة.
- القنوات NSFW والمحظورة مستبعدة.
- فشل مصدر بث لا يكسر الصفحة ويمكن تجربة بديل.
- الأفلام لا تعمل إلا عبر مصدر يملك العميل حق استخدامه.
- Lighthouse مستهدف: Performance ≥ 85، Accessibility ≥ 95 على الصفحة الرئيسية.
- اختبارات أساسية لتسجيل الحساب، التحقق، تسجيل الدخول، تبديل اللغة، البحث، progress، وقناة HLS.
- النشر يحافظ على الجمهور الحالي ما لم يطلب المالك غير ذلك.

---

## 16. تعليمات ختامية لـCodex

1. افحص المشروع الحالي ولا تنشئ مشروعًا بديلًا.
2. ضع خطة قصيرة ثم نفّذ مرحلة مكتملة قابلة للاختبار، لا مجرد mockups.
3. حافظ على هوية OctoTV الحالية وطوّرها، ولا تنسخ علامة Movy.
4. استخدم المصادر الرسمية المذكورة أعلاه.
5. إذا طلب المالك نفس مصدر أفلام Movy، اطلب إثبات الترخيص أولًا؛ وإلى أن يصل، استخدم DemoPlaybackProvider أو مزوّدًا مرخّصًا.
6. نفّذ Google/email auth خارج ChatGPT كما هو موضح.
7. تحقّق من البناء، migrations، الاختبارات، وتدفقات المصادقة قبل النشر.
8. انشر النسخة الخاصة الجديدة واذكر بوضوح ما اكتمل وما يحتاج مفاتيح أو تراخيص من المالك.
