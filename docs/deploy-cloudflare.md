# نشر OctoTV على Cloudflare Workers

OctoTV مبني باستخدام Vinext وCloudflare Workers، ويعتمد على ربط D1 باسم `DB` وR2 باسم `BUCKET`. لذلك لا تستخدم إعداد Vercel أو `next build` لهذا المشروع؛ Vercel يتوقع ملف `.next/routes-manifest.json` الذي لا ينتجه Vinext.

## المتطلبات

- قاعدة D1 موجودة مسبقًا باسم `octotv-db`.
- حاوية R2 موجودة مسبقًا باسم `octotv-media`.
- Cloudflare API token بصلاحيات نشر Workers وإدارة ربط D1 وR2.
- معرّف الحساب ومعرّف قاعدة D1 الحالية.

لا ينشئ مسار النشر موارد Cloudflare جديدة. لا تستخدم معرّف D1 الوهمي الموجود في الإعداد المحلي للنشر الإنتاجي.

## النشر من سطر الأوامر

اضبط المتغيرات التالية في بيئة آمنة، ثم شغّل:

```sh
pnpm install --frozen-lockfile
pnpm deploy:cloudflare
```

المتغيرات المطلوبة:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`

يقوم الأمر بالبناء ثم ينشر إعداد Wrangler الناتج من `dist/server/wrangler.json`. لا تحفظ قيم الأسرار أو معرّف الحساب في Git.

## إعداد Git integration

اربط المستودع بـCloudflare Workers Builds، واجعل أمر البناء `pnpm deploy:cloudflare`، وأضف المتغيرات المطلوبة في إعدادات build environment الآمنة. أوقف مشروع Vercel أو افصل تكامل GitHub الخاص به حتى لا تستمر عمليات النشر الفاشلة من Vercel.

تأكد أن قاعدة D1 وحاوية R2 المذكورتين أعلاه موجودتان بالفعل قبل النشر، وأن مخطط D1 محدث. إعداد قاعدة البيانات أو إنشاء موارد جديدة خارج نطاق أمر النشر.
