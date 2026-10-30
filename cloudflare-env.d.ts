declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;

    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    APP_BASE_URL?: string;

    TMDB_READ_ACCESS_TOKEN?: string;
    TMDB_API_READ_TOKEN?: string;
    ANILIST_GRAPHQL_URL?: string;

    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;

    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;

    MUX_TOKEN_ID?: string;
    MUX_TOKEN_SECRET?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_STREAM_API_TOKEN?: string;
    BUNNY_STREAM_API_KEY?: string;
    BUNNY_STREAM_LIBRARY_ID?: string;

    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;

    PLAYBACK_PROVIDER?: string;
    IPTV_PLAYLIST_URL?: string;
  }
}
