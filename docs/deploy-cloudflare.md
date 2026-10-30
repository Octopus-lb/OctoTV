# نشر OctoTV على Cloudflare Workers

OctoTV مبني باستخدام Vinext وCloudflare Workers، ويستخدم قاعدة D1 عبر الربط `DB`. لا يعتمد التطبيق حاليًا على R2، لذلك لا يلزم تفعيل R2 أو إنشاء حاوية له. لا تستخدم إعداد Vercel أو `next build` لهذا المشروع؛ Vercel يتوقع ملف `.next/routes-manifest.json` الذي لا ينتجه Vinext.

## المتطلبات

- قاعدة D1 موجودة مسبقًا باسم `octotv-db`.
- Cloudflare API token بصلاحيات نشر Workers وإدارة ربط D1.
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

تأكد أن قاعدة D1 المذكورة أعلاه موجودة بالفعل قبل النشر وأن مخططها محدث. إعداد قاعدة البيانات أو إنشاء موارد جديدة خارج نطاق أمر النشر.
