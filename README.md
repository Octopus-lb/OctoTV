# OctoTV

For production deployment, use Cloudflare Workers. See [Cloudflare deployment](docs/deploy-cloudflare.md) for the required existing D1/R2 bindings and deployment command. This Vinext project is not configured for Vercel's Next.js build adapter.

**An independent, multilingual streaming-platform foundation.** OctoTV brings together a media catalog, household profiles, watch activity, live-channel discovery, and a rights-aware playback layer in one self-hostable application.

> OctoTV is not a content-licensing service. Public metadata or stream listings do not grant redistribution rights. Operators must verify and document the rights for every asset and territory before enabling playback.

## Project at a glance

- **Languages:** Arabic (RTL), English, Turkish, and French.
- **Application:** Next.js App Router-compatible app powered by Vinext, React 19, and TypeScript.
- **Runtime target:** Cloudflare Workers, with D1 for relational data and optional R2 storage.
- **Authentication:** Better Auth with email/password, optional Google OAuth, verification, and password recovery.
- **Catalog metadata:** TMDB and AniList integrations; metadata is separate from playable media.
- **Playback:** HLS.js/native playback through demo or explicitly configured, owner-authorized providers.
- **Live TV:** IPTV-org channel discovery, country/category filters, channel search, favorites, and EPG where available.

## Capabilities

- Browse movies, series, and anime; open title details and watch pages.
- Create profiles and manage watch history, progress, watchlists, and custom lists.
- Discover live channels by country or category, search by channel name, and save favorites.
- Use localized interfaces, with right-to-left layout for Arabic.
- Integrate playback providers only after configuring credentials and verifying current content rights.
- Run locally without deploying or provisioning paid services.

## Architecture

```text
Browser (/{locale}; Arabic RTL, English/Turkish/French LTR)
        │
        ▼
Vinext App Router on Cloudflare Workers
 ├── Better Auth ── sessions, email/password, optional OAuth
 ├── Catalog ── TMDB + AniList metadata
 ├── Profiles/activity ── D1 watch history, progress, lists, watchlists
 ├── Playback ── rights-authorized providers → HLS.js/native player
 └── Live TV ── IPTV-org listings + EPG where available
        │
        ├── D1: application records and authentication rate limits
        └── R2: optional, owner-authorized storage
```

OctoTV does not crawl protected players, bypass DRM, proxy arbitrary video, or persist browser `blob:` URLs. Demo streams are for player development only and must not be treated as production content rights.

## Requirements

- Node.js `>=22.13.0`
- pnpm `11.25.0` (the version declared by `package.json`)
- Git

## Run locally

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install
```

Create local Worker variables from the blank template and set a fresh authentication secret:

```bash
cp .env.example .dev.vars
```

On Windows PowerShell, use `Copy-Item .env.example .dev.vars` instead. Generate a random secret with:

```bash
node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
```

Put the generated value in `.dev.vars` as `BETTER_AUTH_SECRET`. `.dev.vars` is ignored by Git; never commit real credentials.

Apply the local D1 migrations and start the development server:

```bash
pnpm exec wrangler d1 migrations apply octotv-db --local --config wrangler.d1.jsonc --persist-to .wrangler/state
pnpm dev
```

Open <http://localhost:5173>. Local D1 state is stored under `.wrangler/`. No OAuth provider, email service, paid resource, or production deployment is required for the basic local preview.

## Configuration

See [`.env.example`](.env.example) for the complete blank template. Configure values only when you intend to use the related integration.

| Setting | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Session and authentication signing secret; required for auth. |
| `BETTER_AUTH_URL`, `APP_BASE_URL` | Canonical application/authentication URLs. |
| `TMDB_READ_ACCESS_TOKEN` | Server-side TMDB catalog metadata. |
| `ANILIST_GRAPHQL_URL` | AniList GraphQL endpoint; public endpoint is the default. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification and password-recovery email delivery. |
| `PLAYBACK_PROVIDER` and provider-specific settings | Select an owner-authorized playback integration. |
| `IPTV_PLAYLIST_URL` | Optional live-channel playlist source. Listings are not a rights grant. |
| `R2_*` | Optional object storage/download configuration. |

Provider secrets belong in local `.dev.vars` or the platform's secret manager—not in client code, source control, URLs, or logs. Do not create paid accounts or deploy without explicit authorization.

## Database and migrations

The Drizzle schema is in [`db/schema.ts`](db/schema.ts); SQL migrations and snapshots are in [`drizzle/`](drizzle/).

After changing the schema:

```bash
pnpm db:generate
pnpm exec wrangler d1 migrations apply octotv-db --local --config wrangler.d1.jsonc --persist-to .wrangler/state
```

Production migrations are deliberately not automatic. Review each migration, select the correct database, and obtain owner approval before applying it remotely. Backups, retention, and restore guidance are documented in [`docs/security-operations.md`](docs/security-operations.md).

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The test suite covers locale dictionary parity, same-origin request checks, playback token integrity and authorization, source selection, channel parsing/filtering, and safe channel exclusions.

## Rights, privacy, and operations

- Public availability is not permission to rebroadcast. Confirm source terms and current licenses for the relevant territories, devices, and playback/download modes.
- Do not enable production playback without documented rights and expiry handling for each asset.
- Configure backups, retention/deletion rules, monitoring, incident ownership, email/OAuth credentials, and applicable legal notices before launch.
- The repository's legal and operations notes are implementation placeholders, not legal advice or a certification of compliance.

See [`docs/security-operations.md`](docs/security-operations.md) for the production-readiness checklist, [`docs/content-sources.md`](docs/content-sources.md) for the approved and rejected content sources plus the cost model, and [`docs/reports/`](docs/reports/) for implementation and QA reports.

## Deployment

This repository does not deploy itself or provision Cloudflare resources. Cloudflare Workers, D1, R2, and video services may incur costs; review current vendor plans, egress policies, and licensing terms before choosing a production setup. Deployment is a separate, owner-approved release action.

## License and attribution

The project is distributed under the MIT License; see [`LICENSE`](LICENSE). Respect the individual licenses and terms of third-party dependencies, metadata providers, artwork sources, channel directories, and media providers. TMDB/AniList/IPTV-org attribution does not imply endorsement or grant media rights or media redistribution permission.
