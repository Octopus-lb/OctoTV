# Phase 0 — Audit report

## Findings

- The checkout began as a starter prototype with legacy hosting integration, a small existing visual surface, and no independent catalog/auth/playback backend suitable for the requested platform.
- The legacy hosting references and connector-specific runtime were not suitable for a portable OctoTV deployment. The implementation removed those code/runtime dependencies and adopted Vinext + Cloudflare Workers, with local D1/R2 bindings.
- No licensed production media assets or provider credentials were present. Playback therefore must remain a provider abstraction with test-only demo streams until the owner supplies authorized provider accounts and rights-cleared assets.
- TMDB, AniList, and IPTV-org can support metadata/listings but do not grant video redistribution rights. No protected playback extraction or DRM bypass is implemented.
- Existing visual identity is retained through the dark OctoTV surface, red accent, typography, cards, and hero styling; third-party brand assets are not reused.

## Constraints and risks

- TMDB/OAuth/email integrations require owner secrets. Local Better Auth needs a generated secret; production auth also needs canonical URLs and email/OAuth configuration.
- Production D1/R2 resource IDs and provider credentials are intentionally not created or deployed without approval.
- Public IPTV stream availability, CORS, and rights vary by source and jurisdiction; production channel enablement requires review.
- Cost is driven mostly by video storage and delivery. Vendor pricing changes; see the linked live pricing pages in the root README.

## Disposition

Proceed with independent application runtime, schema, provider abstractions, rights-aware authorization, demo fallback, and explicit setup documentation. Do not treat the old reference site's undocumented providers as an integration target.
