# تشغيل OctoTV على Windows

هذه الحزمة تحتوي على كود المصدر القابل للتعديل، وليست حزمة النشر المبنية.

## النقل إلى D:\OctoTV

1. فك ضغط الأرشيف.
2. انسخ محتويات مجلد `OctoTV` الناتج إلى `D:\OctoTV`.
3. افتح PowerShell داخل `D:\OctoTV`.

## التشغيل المحلي

المتطلبات:

- Node.js 22.13 أو أحدث.
- Git.
- اتصال إنترنت عند تثبيت الحزم للمرة الأولى.

نفّذ:

```powershell
cd D:\OctoTV
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install
Copy-Item .env.example .dev.vars
# عدّل .dev.vars وضع قيمة عشوائية محلية لـ BETTER_AUTH_SECRET
pnpm db:generate
pnpm exec wrangler d1 migrations apply octotv-db --local --config wrangler.d1.jsonc --persist-to .wrangler/state
pnpm dev
```

ثم افتح العنوان الذي يطبعه الطرفية، وغالبًا يكون:

```text
http://localhost:5173
```

## أمر جاهز لإرساله إلى Codex

```text
المشروع موجود محليًا في D:\OctoTV. ابدأ بقراءة CODEX_HANDOFF_AR.md ثم افحص package.json والكود الحالي. ثبّت الحزم وشغّل فحوص البناء والواجهة. طوّر OctoTV وفق خطة التسليم، مع تسجيل الدخول بواسطة Google أو البريد وكلمة المرور وتأكيد البريد، ودعم العربية والإنجليزية والتركية والفرنسية. لا تستخدم تسجيل ChatGPT في النسخة المستقلة. استخدم فقط مصادر بث مرخّصة أو يملكها صاحب المشروع، ولا تدمج أو تستخرج روابط بث مقرصنة. قبل أي نشر، اعرض عليّ الخيارات والتكلفة والمتطلبات.
```

## ملاحظات مهمة

- `.dev.vars` محلي فقط ومضاف إلى `.gitignore`؛ لا ترفع أي أسرار إلى Git.
- دون `TMDB_READ_ACCESS_TOKEN` تعرض الواجهة بيانات كتالوج تجريبية موسومة بوضوح. تشغيل مصادقة Better Auth محليًا يتطلب `BETTER_AUTH_SECRET`.
- بث الفيديو في وضع العرض يستخدم روابط اختبار عامة للتحقق من المشغل فقط. يلزم إعداد مزود أصول مرخّص وربط ملفات تملك حقوقها قبل تشغيل محتوى فعلي.
- لا ينشئ المشروع موارد Cloudflare مدفوعة ولا ينشر تلقائيًا. راجع `README.md` وتعليمات التقارير في `docs/reports/` قبل الإطلاق.
- لا توجد أسرار إنتاج أو مجلد `node_modules` داخل الأرشيف.
