# Security and data operations checklist

This document records application safeguards and the owner decisions required
before production. It is operational guidance, not legal advice or a claim of
regulatory compliance. No production resources or backups are created by this
repository change.

## Access and request protection

- Keep Cloudflare, D1, R2, email, OAuth, and playback credentials in the
  provider's secret store. Never commit `.dev.vars`, exports, tokens, or
  temporary playback URLs.
- Grant dashboard and production access by least privilege; require MFA for
  administrators and review access after personnel changes.
- Browser write requests to `/api` require an exact same-origin `Origin`.
  Better Auth uses D1-backed counters and stricter limits for sign-in,
  registration, password reset, and verification email. Verify Cloudflare's
  `CF-Connecting-IP` trust boundary if traffic can bypass Cloudflare.
- Review the Worker security headers against any future OAuth popup, embeds,
  and player requirements before changing them. A CSP is not enabled yet; define
  it from the final set of trusted script/media hosts rather than using a broad
  wildcard.

## Backup and restore (owner action before launch)

1. Choose a backup owner, cadence, retention period, encryption/access policy,
   and recovery-point/recovery-time objectives. Do not treat Cloudflare's
   platform durability as a tested backup.
2. With owner approval and the correct account/database selected, export D1 to
   an encrypted, access-controlled location using the current Wrangler D1
   export workflow. Do not put exports in the repository or a public bucket.
3. Record export time, database identity, migration version, and success/failure
   without recording credentials or user data in general application logs.
4. Restore a copy into an isolated non-production database, apply/check the
   migration level, and run auth, profile-isolation, and playback-rights smoke
   tests. Record the measured recovery time and any data loss window.
5. Repeat a restore drill on the owner-approved schedule and delete expired
   backup copies according to the chosen retention policy.

No backup or recovery has been performed as part of the current QA work.

## Retention and deletion (owner decision)

- Inventory account/contact data, sessions, verification records, profiles,
  watch history/progress, downloads, admin audit events, and provider sync data.
- For each category, document purpose, retention duration, deletion trigger,
  legal-hold exception, and deletion method. Obtain owner/legal review for the
  jurisdiction and providers involved; do not infer a universal period.
- Add and test account deletion/export workflows before promising them in a
  privacy notice. Validate cascades and backup expiry so deletion claims match
  actual copies and systems.

## Monitoring and incident response

- Configure owner-approved alerts for Worker error rate/latency, D1 failures,
  auth throttling spikes, email delivery failures, sync failures, and playback
  authorization denials. Confirm alert routing and an on-call owner.
- Use Cloudflare's dashboard/Worker logs for operational diagnostics; never log
  passwords, cookies, authorization headers, verification/reset URLs, full
  request bodies, signed playback/download links, or unnecessary personal data.
- Keep structured events minimal and redact user identifiers where possible.
  Define log retention and access controls in the provider configuration.
- Maintain an incident checklist: contain/revoke credentials, preserve only
  necessary evidence, assess affected data/systems, notify the owner and obtain
  jurisdiction-specific advice on required notices, then document remediation.

## Content rights and notices

- Enable playback only for assets/channels for which the operator has current,
  documented rights in the relevant territories and distribution modes.
- Record rights holder, license scope/territory, effective/expiry dates,
  permitted playback/download modes, and takedown contact. Revalidate rights
  before each sync and automatically stop expired assets.
- Confirm the source/provider terms allow the intended metadata, images,
  streams, caching, and user access. Public availability is not proof of a
  license. The demo player and public test streams are not production rights.
- Have qualified counsel review localized Terms, Privacy, copyright/takedown,
  and contact text. The current pages are product notices, not verified legal
  documents or a representation of compliance.
