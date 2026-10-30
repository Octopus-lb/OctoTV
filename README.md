# OctoTV

An independent, multilingual streaming-platform foundation built with Next.js 16 / Vinext, React 19, TypeScript, Cloudflare Workers, D1, R2, Drizzle ORM, and HLS.js. The catalog metadata and playback media are separate systems: TMDB and AniList supply metadata, while playback is available only from demo streams or owner-authorized providers/assets.

## Architecture

```text
Browser (/{locale}; ar RTL, en/tr/fr LTR)
        │
        ▼
Vinext App Router on Cloudflare Workers
 ├── Better Auth ── email/password, OAuth, verification, sessions
 ├── Catalog service ── D1 cache/repository ← TMDB + AniList
 ├── Playback service ── authorized provider adapters → HLS.js/native player
 ├── Activity/profiles ── D1 (watch history, progress, lists, watchlist)
 └── Live TV ── IPTV-org metadata/source listings + EPG
        │
        ├── D1: Drizzle-managed application records
        └── R2: optional, rights-cleared media/download assets
```

Metadata, art, trailer references, media assets, and user accounts do not depend on a third-party streaming site. OctoTV does not crawl protected players, bypass DRM, proxy arbitrary video, or store browser `blob:` URLs. Public IPTV listings are not treated as redistribution rights; verify terms and jurisdiction before enabling sources.

## Requirements and local setup

- Node.js `>=22.13.0`
- pnpm `11.25.0` (via Corepack)

```powershell
corepack enable
corepack prepare pnpm@11.25.0 --activate
cd D:\OctoTV
pnpm install
Copy-Item .env.example .dev.vars
```

Set a fresh random `BETTER_AUTH_SECRET` in `.dev.vars` before using authentication. Keep `.dev.vars` local; it is ignored by Git. Then:

```powershell
pnpm db:generate
pnpm exec wrangler d1 migrations apply octotv-db --local --config wrangler.d1.jsonc --persist-to .wrangler/state
pnpm dev
```

Open `http://localhost:5173`. The local D1 migration has already been applied for this checkout. The `.dev.vars` file contains a locally generated secret; replace it before using this directory on another machine. No provider credentials, paid accounts, or production deployment are included.

TMDB works when `TMDB_READ_ACCESS_TOKEN` is configured; AniList's public GraphQL endpoint needs no key. Without TMDB credentials or seeded catalog records, the app falls back to clearly identified demo catalog data. Demo playback uses public player test streams solely to verify player behavior. Production playback needs owner-authorized provider credentials and registered, licensed playback assets.

## Environment and providers

See [`.env.example`](.env.example) for the full blank template. Important settings:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_BASE_URL` | Sessions, signing, and canonical app links |
| `TMDB_READ_ACCESS_TOKEN` | Server-side TMDB metadata only |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification/reset email delivery |
| `PLAYBACK_PROVIDER` and provider-specific keys | Owner-configured Mux, Cloudflare Stream, Bunny, or private library integrations |
| `IPTV_PLAYLIST_URL` | Optional IPTV-org playlist source; default listing is metadata, not a rights grant |

Do not put provider secrets in client code. Download access requires verified rights and a short-lived signed URL. Do not create paid provider accounts or deploy without explicit owner approval.

## Database

The Drizzle schema lives in [`db/schema.ts`](db/schema.ts); generated SQL migrations are in [`drizzle/`](drizzle/). After schema edits:

```powershell
pnpm db:generate
pnpm exec wrangler d1 migrations apply octotv-db --local --config wrangler.d1.jsonc --persist-to .wrangler/state
```

Production migrations are not run automatically. Configure a real D1 database ID and apply reviewed migrations as a separate, authorized release step. R2 is optional for local development and production; this project does not provision buckets.

## Quality checks

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The Node-native test suite covers locale dictionary parity, playback-token signing/tampering/expiry, authorized server selection and fallback rules, quality filtering, M3U parsing, NSFW exclusion, and channel blocklists. Lint currently reports only the framework's `<img>` performance advisories; no lint errors.

## Deployment and operating cost

Deployment is intentionally not performed from this repository session. A Cloudflare Workers + D1 + R2 deployment is a reasonable target, but actual monthly spend depends on current plan allowances, requests, database reads/writes, stored media, and video delivery. Video bandwidth/storage is likely the dominant variable cost; evaluate each media provider's current pricing, egress policy, and licensing terms before choosing one.

- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Mux pricing](https://www.mux.com/pricing)
- [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/)
- [Bunny Stream pricing](https://bunny.net/pricing/stream/)

Review current vendor pricing rather than relying on a static estimate. Before a launch, configure production secrets, authorized content and rights windows, verified email/OAuth redirect URLs, backups/retention, rate limits, monitoring, and applicable legal/privacy notices.

## Project reports

Implementation status and verification notes are tracked under [`docs/reports/`](docs/reports/). The original project brief and requirements are retained in [`CODEX_HANDOFF_AR.md`](CODEX_HANDOFF_AR.md).
