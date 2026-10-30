# OctoTV architecture

```mermaid
flowchart TD
  Browser[Browser: locale-prefixed React UI]
  Worker[Vinext App Router on Cloudflare Workers]
  Auth[Better Auth]
  Catalog[Catalog service]
  Playback[Playback service and provider registry]
  Activity[Profiles and activity repositories]
  Live[Live TV and EPG service]
  D1[(Cloudflare D1)]
  R2[(Optional Cloudflare R2)]
  TMDB[TMDB metadata API]
  AniList[AniList GraphQL]
  IPTV[IPTV-org channel and guide data]
  Providers[Owner-authorized media providers]
  HLS[HLS.js / native HLS player]

  Browser --> Worker
  Worker --> Auth
  Worker --> Catalog
  Worker --> Playback
  Worker --> Activity
  Worker --> Live
  Auth --> D1
  Catalog <--> D1
  Catalog --> TMDB
  Catalog --> AniList
  Activity --> D1
  Playback <--> D1
  Playback --> Providers
  Playback --> R2
  Live --> D1
  Live --> IPTV
  Playback --> Browser
  Browser --> HLS
  HLS --> Providers
```

## Trust and rights boundaries

- TMDB/AniList are metadata sources, not playback providers. Their IDs are stored separately from provider asset identifiers.
- Playback adapters resolve only registered assets with active status, matching content/episode, allowed server, and valid licensing windows. Demo streams are reserved for demo catalog IDs.
- Signed playback/download tokens are short-lived, server-signed, and checked server-side. Provider credentials are never returned to client code.
- Download authorization also requires `downloadAllowed` and `rightsVerified`; demo assets do not qualify.
- Live TV records are sourced from IPTV-org listings/API and retain attribution. NSFW and blocked channels are filtered by default. Public listing is not proof of redistribution permission.
- D1 unavailability/unmigrated schema degrades read paths to configured public metadata or clearly labeled demo data; write paths report unavailable rather than claiming success.
- R2 is optional and is not used as a general-purpose video proxy.
