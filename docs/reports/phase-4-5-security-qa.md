# Phases 4–5 — Security, compliance readiness, and QA

## Implemented

- Exact-origin protection for API write methods; absent, `null`, malformed, or
  foreign origins are denied.
- Better Auth uses persistent D1 rate-limit counters, tightened auth endpoint
  limits, Cloudflare client-IP header configuration, explicit model/schema
  compatibility, disabled automatic account linking, and a non-user-editable
  role field.
- Verification/reset URLs and provider response bodies are not written to logs;
  production email fails closed when the sender is unconfigured.
- Worker responses receive baseline security headers; API responses are
  `private, no-store`.
- Poster, hero, cast, and channel images use `next/image`; external images remain
  unoptimized to avoid inventing trusted remote host patterns.
- Added `docs/security-operations.md` for owner actions on D1 backup/restore,
  retention/deletion, monitoring, incident handling, and rights review.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (7 tests), and `pnpm build` pass.
- Local `GET /api/auth/get-session` returns `200` with `null` for an anonymous
  session. A local sign-in throttle probe returned five `401`s then `429`.
- Local foreign-origin API write returned `403`; same-origin unauthenticated
  write reached the route and returned `401`.
- Lighthouse on `/en`: Accessibility 1.00, Best Practices 1.00, SEO 0.80.
  Lighthouse still reports missing description although Chromium DOM inspection
  shows the localized description meta tag. This appears to be a
  framework/tooling discrepancy and remains open.
- Build warns that `middleware` is deprecated in favor of `proxy`, and that a
  client chunk exceeds 500 kB. Neither blocks the build.

## Not completed / production gates

- No production deployment, paid resource, production backup, OAuth provider,
  email sender, or real media source was created or exercised.
- Owner must approve backup/retention objectives, alert routing, account
  deletion/export commitments, and qualified legal review.
- Confirm licensed rights and territory/mode scope for every production asset;
  public demo streams are not a rights grant.
- Test real registration, email verification/reset, Google OAuth, and restore
  drills only with owner-approved credentials and isolated test resources.
